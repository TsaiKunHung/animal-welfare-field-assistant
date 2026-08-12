import { useEffect, useMemo, useRef, useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { AiBadge, Modal, PhotoArt, Textarea } from '../components/ui.jsx'
import { CARE_GUIDE_URL, careGuideFor, recordFormFor } from '../store/evidence.js'
import {
  BarChart2,
  BookOpen,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  Clipboard,
  Cloud,
  CloudOff,
  Edit,
  FileText,
  Image,
  MessageCircle,
  Mic,
  Pause,
  Play,
  Search,
  ExternalLink,
  Printer,
  Sparkles,
  Star,
  ThumbsUp,
  StopCircle,
  User,
  X,
} from '../components/icons.jsx'

/*
  F3 外勤工作主頁 — 整個系統的核心工作台。
  Figma page 10069:948「F3 外勤工作主頁」＋ 另外三個 page 合併進本檔：
    F3-1  外勤小助手 / 現場蒐證與紀錄 / Default   (10107:2)   → 主畫面
    F3-1-1 Offline                              (10115:151) → 頂欄雲端狀態切換（點雲朵徽章）
    F3-1-2 Responsive / 1024                    (10118:552) → 版型改用 flex，自動適應
    F3-2  未完成所有 Checklist 就結案            (10116:280) → confirmOpen 攔截彈窗
    F4-1  AI 整理摘要頁                          (11344:156 / 11587:811) → 逐字稿區第二個分頁
    F8-1  筆記本 / 置中卡片                       (12203:4357) → notebookOpen 彈窗
    F11-1/2/3 文字摘要與檢測確認                  (11088:1292 等) → 關鍵詞命中彈窗
  子畫面全部在本檔用 useState 切換，不另開路由。

  ⚠️ Figma 稿面沿用舊案（0927492927 四維路米克斯貓／台北市），
     這裡一律改成全域 state.activeCase（AC-1150811-003 文化路米克斯犬／新北市板橋區）。
*/

/* 本頁的圖示全部來自共用 icons.jsx（Feather），不再自繪。
   Figma 對照：工具列 user/search/image/file-text/book-open、
   蒐證清單 action camera/image/edit、標記重點 bookmark、結束錄音 stop-circle。 */

/* ── 左側工具列：Figma 稿面是「五個」工具（第五個是筆記本，開本頁彈窗） ── */
const TOOLS = [
  { key: 'f5', label: '飼主身分查詢', Icon: User },
  { key: 'f6', label: '寵物晶片查詢', Icon: Search },
  { key: 'f7', label: '瀏覽案件照片', Icon: Image },
  { key: 'f9', label: '案件內容', Icon: FileText },
  { key: 'notebook', label: '筆記本', Icon: BookOpen },
]

/* ── 逐字稿播放腳本（按下錄音後一句一句長出來） ──
     trigger 指到 checklist id：長到那一句時自動跳 F11 關鍵詞確認彈窗 */
const SCRIPT = [
  { t: '10:32:06', speaker: '動檢員', text: '您好，我們是新北市動物保護處，今天依通報內容前來了解動物飼養情形。' },
  { t: '10:32:24', speaker: '飼主', text: '好，狗目前關在後面陽台，我先帶你們過去。' },
  { t: '10:33:11', speaker: '動檢員', text: '現場可見一隻中型米克斯犬，活動區域有遮蔽，但飲水盆水量明顯不足。' },
  {
    t: '10:33:40',
    speaker: '動檢員',
    text: '地面有排泄物堆積、通風不良，靠近時可聞到明顯異味，衛生狀況不佳。',
    trigger: 'env-2',
  },
  { t: '10:34:02', speaker: '飼主', text: '最近工作比較忙，還沒來得及清理。' },
  {
    t: '10:34:35',
    speaker: '動檢員',
    text: '這隻狗的精神狀態不佳，趴著不太動，叫牠也沒什麼反應，活動力偏低。',
    trigger: 'ani-2',
  },
  { t: '10:35:10', speaker: '飼主', text: '牠平常還算活潑，可能是今天天氣太熱。' },
  { t: '10:35:48', speaker: '動檢員', text: '我先拍攝生活環境全景，接著確認犬隻外觀與晶片資料。' },
  {
    t: '10:36:20',
    speaker: '動檢員',
    text: '晶片掃描號碼是 900115000530794，稍後比對寵物登記資料。',
    trigger: 'own-2',
  },
  {
    t: '10:36:55',
    speaker: '動檢員',
    text: '請於七日內帶動物就醫，三十日內完成環境改善，屆時本處會安排複查。',
  },
]

/* AI 偵測關鍵詞（F11 右欄「檢測關鍵詞」那一列） */
const KEYWORDS = {
  'env-1': ['環境', '場所', '空間', '鐵籠', '陽台', '遮蔽'],
  'env-2': ['遮蔽', '通風', '衛生', '異味', '排泄物', '清潔', '髒亂', '氣味'],
  'env-3': ['飲水', '水盆', '食物', '飼料', '餵食', '水量'],
  'ani-1': ['外觀', '毛髮', '體態', '品種', '特徵', '體型'],
  'ani-2': ['活動力', '精神', '狀態', '行為', '反應', '健康', '虛弱', '活潑', '萎靡'],
  'ani-3': ['外傷', '傷口', '皮膚', '疾病', '跛行', '消瘦'],
  'own-1': ['飼主', '身分', '聯絡', '電話', '姓名', '證件'],
  'own-2': ['晶片', '掃描', '寵物登記', '號碼', '植入', '登記資料'],
}

const GROUP_ORDER = ['環境紀錄', '動物狀況', '飼主資訊']

/* 筆記本第一次打開時帶入的現場筆記（Figma F8 稿面文案，改成本案的犬隻情境） */
const SEED_NOTES = [
  '現場 1 隻米克斯犬，陽台鐵籠空間明顯不足',
  '飲水盆水量不足、飼料未即時補充',
  '排泄物堆積、通風不良，異味明顯',
]

/* 波形柱（Figma Field recording bar / Waveform 是 24 根、寬 4、間距 4）
   每根柱子預先算好自己的最大高度、週期與相位；動畫本身交給 CSS（見 tokens.css），
   不用 JS 每秒重算，才不會整排同時跳。 */
const WAVE = [10, 18, 28, 16, 34, 22, 12, 30, 20, 36, 16, 26, 12, 32, 18, 24, 14, 28, 10, 20, 34, 16, 22, 12].map(
  (h, i) => ({
    h: Math.max(14, h),
    // 0.62–1.18s：長短交錯，避免所有柱子週期一致而產生整齊的節拍
    dur: 0.62 + ((i * 7) % 9) * 0.07,
    // 相位錯開一整個週期，看起來像聲音從左往右掃過去
    delay: -(((i * 5) % 11) * 0.11),
  }),
)

const pad = (n) => String(n).padStart(2, '0')
const fmt = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
const isPhotoItem = (label) => label.startsWith('拍攝')

export default function F3Workbench() {
  const { state, dispatch, checklistDone, checklistTotal, checklistComplete } = useApp()
  const c = state.activeCase

  /* 頂欄雲端同步狀態（F3-1-1 Offline 版：點徽章切換） */
  const [online, setOnline] = useState(true)

  /* 錄音狀態機 idle | recording | paused */
  const status = state.recording.status === 'done' ? 'idle' : state.recording.status
  const setStatus = (s) => dispatch({ type: 'SET_RECORDING', payload: { status: s } })
  const [elapsed, setElapsed] = useState(0)

  /* 逐字稿播放進度 —— 從已經播過的句數接下去，離開 F3 去拍照再回來不會從頭重播 */
  const [cursor, setCursor] = useState(() => state.transcript.length)
  const scrollRef = useRef(null)

  /* 分頁 / 面板 / 彈窗 */
  const [tab, setTab] = useState('raw') // raw | ai
  const [notebookOpen, setNotebookOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  /* 目前就地展開的蒐證項目 id（拍完照後看照片用） */
  const [openItem, setOpenItem] = useState(null)
  /* 目前開著文字紀錄彈窗的蒐證項目 */
  const [recordFor, setRecordFor] = useState(null)
  const [collapsed, setCollapsed] = useState({})

  /* ── 計時器：錄音中每秒 +1（波形動畫由 CSS 跑，不吃這個 tick） ── */
  useEffect(() => {
    if (status !== 'recording') return
    const id = setInterval(() => setElapsed((v) => v + 1), 1000)
    return () => clearInterval(id)
  }, [status])

  /* ── 逐字稿自動長出來：每 2.4 秒一句 ──
     ⚠️ 2026-08-11 改：AI 檢核到內容時**不再打斷動檢員跳彈窗**。
        命中只記進 aiHits，讓對應的蒐證項目長出「AI 已帶入」徽章；
        動檢員點開那一項時才會看到 AI 帶了什麼進來。 */
  useEffect(() => {
    if (status !== 'recording' || cursor >= SCRIPT.length) return
    const id = setTimeout(() => {
      const line = SCRIPT[cursor]
      dispatch({
        type: 'PUSH_TRANSCRIPT',
        payload: { t: line.t, speaker: line.speaker, text: line.text, marked: false },
      })
      setCursor((v) => v + 1)
      if (line.trigger) dispatch({ type: 'ADD_AI_HIT', id: line.trigger, payload: line })
    }, 2400)
    return () => clearTimeout(id)
  }, [status, cursor, dispatch])

  /* 新句子出現就捲到底 */
  useEffect(() => {
    if (tab !== 'raw') return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.transcript.length, tab])

  /* ── AI 整理摘要（可編輯；離開分頁時已寫進全域，F12 會接手） ── */
  const [summary, setSummary] = useState({
    overview:
      '現場發現 1 隻米克斯犬，飼養於後陽台鐵籠內。飼養環境有異味，地面見排泄物與打翻的水。犬隻毛髮局部脫落，精神狀態不佳。',
    env: '周邊環境有異味\n地面見排泄物與打翻的水',
    animal: '體型中等，毛髮局部脫落\n精神萎靡、活動力偏低',
    quote: '「 水剛剛被牠打翻了，脫毛之前有看過醫生。 」',
    statement: '已告知飼主現場稽查結果，要求立即補充飲水並於 7 日內帶動物就醫，30 日內完成環境改善，屆時將安排複查；飼主當場表示知悉並配合。',
  })
  useEffect(() => {
    if (tab === 'ai') dispatch({ type: 'SET_AI_SUMMARY', payload: summary })
  }, [tab, summary, dispatch])

  const groups = useMemo(() => {
    const map = {}
    state.checklist.forEach((item) => {
      ;(map[item.group] ||= []).push(item)
    })
    const keys = [...GROUP_ORDER.filter((k) => map[k]), ...Object.keys(map).filter((k) => !GROUP_ORDER.includes(k))]
    return keys.map((k) => ({ name: k, items: map[k] }))
  }, [state.checklist])

  const undone = state.checklist.filter((i) => !i.done)

  /* ── 動作 ── */
  const start = () => setStatus('recording')
  const togglePause = () => setStatus(status === 'recording' ? 'paused' : 'recording')
  const stop = () => setStatus('idle')
  const markHighlight = () => {
    const i = state.transcript.length - 1
    if (i >= 0) dispatch({ type: 'UPDATE_TRANSCRIPT', index: i, payload: { marked: true } })
  }
  const openNotebook = () => {
    if (state.notes.length === 0) {
      SEED_NOTES.forEach((text, i) =>
        dispatch({ type: 'ADD_NOTE', payload: { id: `note-seed-${i}`, text } }),
      )
    }
    setNotebookOpen(true)
  }
  const onTool = (key) => (key === 'notebook' ? openNotebook() : navigate(key))
  const finish = () => (checklistComplete ? navigate('f12') : setConfirmOpen(true))
  /* 拍照類項目：把要拍的對象記到全域，F10 才知道現在在拍哪一項的哪些角度 */
  const openCamera = (item) => {
    dispatch({ type: 'SET_CAMERA_TARGET', id: item.id })
    navigate('f10')
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-canvas">
      {/* ── 頂欄 Top navigation / Field workspace ── */}
      <header className="flex h-[72px] shrink-0 items-center justify-between bg-field-900 pr-9 pl-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('f2')}
            className="flex size-12 items-center justify-center rounded-lg border-2 border-field-700 text-white"
            aria-label="返回"
          >
            <ChevronLeft className="size-6" />
          </button>
          <div className="flex flex-col gap-0.5">
            <p className="text-xl leading-[30px] font-bold text-white">外勤蒐證與紀錄輔助</p>
            <p className="text-xs leading-[18px] font-medium text-field-200">
              案件 {c.id}｜{c.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOnline((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 ${
              online ? 'bg-field-700' : 'bg-warning'
            }`}
            title="切換雲端同步狀態"
          >
            {online ? <Cloud className="size-[18px] text-white" /> : <CloudOff className="size-[18px] text-white" />}
            <span className="text-xs leading-[18px] font-medium text-white">
              {online ? '已同步' : '離線暫存'}
            </span>
          </button>
          <button
            onClick={finish}
            className="flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm leading-5 font-bold text-field-700 shadow-xs"
          >
            完成現場紀錄
          </button>
        </div>
      </header>

      {/* ── Workspace body ── */}
      <div className="flex min-h-0 flex-1 gap-4 p-4">
        {/* 左側工具列 Field tool rail（Figma 現況：五個工具） */}
        <nav className="flex w-[112px] shrink-0 flex-col gap-2 rounded-md bg-white p-2">
          {TOOLS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => onTool(key)}
              className="flex h-[112px] w-full shrink-0 flex-col items-center justify-center gap-2 rounded-md border border-field-200 bg-field-50 px-2 pt-3.5 pb-3 text-center text-sm leading-5 font-bold text-field-700"
            >
              <Icon className="size-6" />
              {/* Figma 標籤寬 62–66px：四字換行（飼主身分／查詢），不要整行擠成 5+1 */}
              <span className="w-16">{label}</span>
            </button>
          ))}
        </nav>

        {/* 逐字稿工作區 Transcript workspace */}
        <section className="flex h-full w-[438px] shrink-0 flex-col overflow-hidden rounded-md bg-white">
          <div className="flex h-16 shrink-0 items-center justify-between px-5">
            <h2 className="text-xl leading-[30px] font-bold text-neutral-900">
              {tab === 'raw' ? '現場轉錄文字' : 'AI 整理摘要'}
            </h2>
            {tab === 'raw' ? (
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs leading-[18px] font-bold ${
                  status === 'recording'
                    ? 'bg-field-50 text-field-700'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    status === 'recording' ? 'bg-field-600' : 'bg-neutral-400'
                  }`}
                />
                {status === 'recording'
                  ? '錄音中'
                  : status === 'paused'
                    ? '已暫停'
                    : state.transcript.length > 0
                      ? '錄音結束'
                      : '尚未開始'}
              </span>
            ) : (
              <AiBadge>AI 產出</AiBadge>
            )}
          </div>

          {/* 分頁 Transcript tabs */}
          <div className="flex h-12 shrink-0 gap-1 px-3 py-1.5">
            <button
              onClick={() => setTab('raw')}
              className={`flex h-9 flex-1 items-center justify-center rounded-sm text-sm leading-5 font-bold ${
                tab === 'raw'
                  ? 'border border-field-200 bg-field-50 text-field-700'
                  : 'text-neutral-500'
              }`}
            >
              原始逐字稿
            </button>
            <button
              onClick={() => setTab('ai')}
              className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm text-sm leading-5 font-bold ${
                tab === 'ai' ? 'border border-field-200 bg-field-50' : ''
              }`}
            >
              <span className="text-xs leading-[18px] text-purple-600">AI</span>
              <span className={tab === 'ai' ? 'text-field-700' : 'text-neutral-500'}>整理摘要</span>
            </button>
          </div>

          {/* 分頁內容 */}
          {tab === 'raw' ? (
            <div
              ref={scrollRef}
              className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-[18px] pb-6"
            >
              <div className="shrink-0 rounded-sm bg-field-50 px-3 py-2.5">
                <p className="text-xs leading-[18px] font-medium text-field-700">
                  錄音中可直接點擊逐字稿修正文字；資料已自動儲存雲端。
                </p>
              </div>

              {state.transcript.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                  <Mic className="size-8 text-neutral-300" />
                  <p className="text-sm leading-5 font-medium text-neutral-500">
                    尚未開始錄音
                  </p>
                  <p className="text-xs leading-[18px] text-neutral-400">
                    按下下方「開始錄音」，逐字稿會即時轉錄
                  </p>
                </div>
              )}

              {state.transcript.map((s, i) => (
                <div key={i} className="flex shrink-0 flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {s.marked && <Bookmark className="size-4 text-field-600" />}
                    <span className="text-xs leading-[18px] font-medium text-neutral-500">{s.t}</span>
                    <span
                      className={`text-xs leading-[18px] font-bold ${
                        s.speaker === '動檢員' ? 'text-field-700' : 'text-neutral-700'
                      }`}
                    >
                      {s.speaker}
                    </span>
                  </div>
                  <p className="text-sm leading-5 font-medium text-neutral-900">{s.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <AiSummaryPane summary={summary} setSummary={setSummary} hasTranscript={state.transcript.length > 0} />
          )}
        </section>

        {/* 蒐證清單 Evidence checklist */}
        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-white">
          <div className="flex h-[88px] shrink-0 flex-col justify-center gap-1 px-5 py-3.5">
            <h2 className="text-xl leading-[30px] font-bold text-neutral-900">
              「{c.type}」蒐證清單
            </h2>
            <p className="text-xs leading-[18px] font-medium text-neutral-500">
              已完成 {checklistDone}／{checklistTotal}
            </p>
          </div>

          <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-1 pb-6">
            {groups.map((g) => {
              const done = g.items.filter((i) => i.done).length
              const open = !collapsed[g.name]
              return (
                <div key={g.name} className="flex shrink-0 flex-col gap-2">
                  <button
                    onClick={() => setCollapsed((v) => ({ ...v, [g.name]: open }))}
                    className="flex w-full items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm leading-5 font-bold text-neutral-900">{g.name}</span>
                      <span className="text-xs leading-[18px] font-bold text-field-700">
                        {done}／{g.items.length}
                      </span>
                    </span>
                    <ChevronDown
                      className={`size-[18px] text-neutral-500 transition-transform ${open ? '' : '-rotate-90'}`}
                    />
                  </button>

                  {open &&
                    g.items.map((item) => {
                      const photo = isPhotoItem(item.label)
                      const photos = state.photos.filter((p) => p.checklistId === item.id)
                      return (
                        <EvidenceRow
                          key={item.id}
                          item={item}
                          photos={photos}
                          /* AI 明確檢核到的那一句；有值且還沒完成 → 整列變紫色 */
                          aiLine={state.aiHits[item.id]}
                          reviewed={!!state.records[item.id]}
                          expanded={openItem === item.id}
                          onToggle={() => dispatch({ type: 'TOGGLE_CHECK', id: item.id })}
                          /* 拍照類：未完成去拍照、已完成就地展開看剛剛拍的照片
                             文字類：一律開文字紀錄彈窗 */
                          onAction={() => {
                            if (!photo) return setRecordFor(item)
                            if (item.done && photos.length > 0)
                              return setOpenItem(openItem === item.id ? null : item.id)
                            openCamera(item)
                          }}
                        />
                      )
                    })}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* ── 底部錄音控制列 Field recording bar ── */}
      <footer className="flex h-20 shrink-0 items-center justify-between border-t border-neutral-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-[7px] rounded-full px-2.5 py-[7px] text-xs leading-[18px] font-bold ${
              status === 'recording' ? 'bg-field-50 text-field-700' : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            <span className={`size-2 rounded-full ${status === 'recording' ? 'bg-field-600' : 'bg-neutral-400'}`} />
            {status === 'recording'
              ? '錄音中'
              : status === 'paused'
                ? '已暫停'
                : state.transcript.length > 0
                  ? '錄音結束'
                  : '尚未錄音'}
          </span>
          <span className="text-sm leading-5 font-bold text-neutral-900">{fmt(elapsed)}</span>
        </div>

        <Waveform status={status} />

        <div className="flex items-center gap-2">
          {status === 'idle' ? (
            <button
              onClick={start}
              className="flex h-12 items-center justify-center gap-2 rounded-md border border-field-600 bg-field-600 px-6 text-sm leading-5 font-bold text-white shadow-xs"
            >
              <Mic className="size-[22px]" />
              開始錄音
            </button>
          ) : (
            <>
              <button
                onClick={markHighlight}
                className="flex h-12 w-[124px] items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white text-sm leading-5 font-bold text-field-700"
              >
                <Bookmark className="size-[22px]" />
                標記重點
              </button>
              <button
                onClick={togglePause}
                className="flex size-12 items-center justify-center rounded-md border border-field-600 bg-field-600 text-white"
                aria-label={status === 'recording' ? '暫停' : '繼續'}
              >
                {status === 'recording' ? <Pause className="size-[22px]" /> : <Play className="size-[22px]" />}
              </button>
              <button
                onClick={stop}
                className="flex h-12 w-[124px] items-center justify-center gap-2 rounded-md border border-danger bg-danger text-sm leading-5 font-bold text-white"
              >
                <StopCircle className="size-[22px]" />
                結束錄音
              </button>
            </>
          )}
        </div>
      </footer>

      {/* ── F11 文字紀錄與檢核彈窗 ── */}
      <RecordModal
        item={recordFor}
        aiLine={recordFor ? state.aiHits[recordFor.id] : null}
        relatedLine={
          recordFor && !state.aiHits[recordFor.id]
            ? lastMatch(state.transcript, recordFor.id)
            : null
        }
        saved={recordFor ? state.records[recordFor.id] : null}
        onClose={() => setRecordFor(null)}
        onSave={(payload) => {
          dispatch({ type: 'SET_RECORD', id: recordFor.id, payload })
          dispatch({ type: 'TOGGLE_CHECK', id: recordFor.id, done: true })
          setRecordFor(null)
        }}
      />

      {/* ── F8 筆記本（Figma 是置中卡片，不是側邊面板） ── */}
      <NotebookModal
        open={notebookOpen}
        notes={state.notes}
        onClose={() => setNotebookOpen(false)}
        onAdd={(text) => dispatch({ type: 'ADD_NOTE', payload: { id: `note-${Date.now()}`, text } })}
        onRemove={(id) => dispatch({ type: 'REMOVE_NOTE', id })}
      />

      {/* ── F3-2 未完成 checklist 就結案的攔截彈窗 ── */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} width={520}>
        <div className="flex flex-col gap-4 p-6">
          <p className="text-xl leading-[30px] font-bold text-neutral-900">
            仍有 {undone.length} 項蒐證內容未完成
          </p>
          <p className="text-sm leading-5 font-medium text-neutral-600">
            你可以返回補充，或確認完成現場紀錄。若直接完成，系統將保留未完成項目與送出時間。
          </p>
          <div className="flex flex-col gap-2">
            {undone.map((i) => (
              <div key={i.id} className="flex items-center gap-2.5 rounded-sm bg-canvas px-3 py-2.5">
                <span className="size-2 shrink-0 rounded-full bg-danger" />
                <span className="text-sm leading-5 font-medium text-neutral-900">{i.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              className="flex h-11 items-center rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm leading-5 font-bold text-neutral-700 shadow-xs"
            >
              返回補充
            </button>
            <button
              onClick={() => {
                setConfirmOpen(false)
                navigate('f12')
              }}
              className="flex h-11 items-center rounded-md bg-field-600 px-4 py-2.5 text-sm leading-5 font-bold text-white shadow-xs"
            >
              確認完成
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* 找出最近一句包含該項目關鍵詞的逐字稿，給 F11 左欄用 */
function lastMatch(transcript, checkId) {
  const words = KEYWORDS[checkId] ?? []
  for (let i = transcript.length - 1; i >= 0; i -= 1) {
    if (words.some((w) => transcript[i].text.includes(w))) return transcript[i]
  }
  return transcript[transcript.length - 1] ?? null
}

/* ── 錄音波形 ──
   錄音中：CSS 逐柱呼吸（週期／相位都不同）。暫停：凍在當下。未錄音：一排低平灰柱。 */
function Waveform({ status }) {
  const on = status === 'recording'
  const paused = status === 'paused'
  return (
    <div
      className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1 ${
        on || paused ? 'wave-on' : ''
      } ${paused ? 'wave-paused' : ''}`}
      aria-hidden="true"
    >
      {WAVE.map((b, i) => (
        <span
          key={i}
          className={`wave-bar w-1 rounded-[2px] ${
            on ? 'bg-field-400' : paused ? 'bg-field-200' : 'bg-neutral-300'
          }`}
          style={{
            height: b.h,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            /* 未錄音時所有柱子縮成同高的一條平線（6px）——
               柱子原始高度不一，若直接用同一個縮放比例，靜止狀態會高低不齊，
               看起來像波形位置跑掉。錄音時才交給 CSS 動畫。 */
            ...(on || paused ? null : { transform: `scaleY(${6 / b.h})` }),
          }}
        />
      ))}
    </div>
  )
}

/* ── 蒐證清單單列 Evidence row ──
   ⚠️ AI 從逐字稿檢核到內容時不主動彈窗（會打斷現場對話）。
      改成整列變成紫色框 —— 「這一項 AI 已經先寫好了，等你審核」。
      動檢員按右側圖示打開文字紀錄彈窗覆核後，紫色就消失。 */
function EvidenceRow({ item, photos = [], aiLine, reviewed, expanded, onToggle, onAction }) {
  const photo = isPhotoItem(item.label)
  /* 圖示：待拍照→相機、已有照片→圖片、文字紀錄一律鉛筆（不會因為完成就變圖片） */
  const ActionIcon = photo ? (item.done && photos.length > 0 ? Image : Camera) : Edit
  const aiPending = !!aiLine && !item.done && !reviewed
  const sub = item.done
    ? photo
      ? `已完成｜${photos.length || item.photos.length || 1} 張照片`
      : '已完成｜內容已記錄'
    : aiPending
      ? 'AI 已依現場錄音填好，待您審核'
      : photo
        ? '需要照片'
        : '需要文字紀錄'

  return (
    <div
      className={`flex shrink-0 flex-col rounded-md border ${
        aiPending
          ? 'border-ai-200 bg-ai-50'
          : item.done
            ? 'border-field-200 bg-field-50'
            : 'border-neutral-200 bg-white'
      }`}
    >
      {/* 平板單手操作：整條都是點擊區，不要逼使用者瞄準右邊那顆小圖示。
          只有左邊的勾選框自己攔截點擊（打勾 ≠ 打開內容）。 */}
      <div
        onClick={onAction}
        role="button"
        tabIndex={0}
        className="flex h-[82px] shrink-0 cursor-pointer items-center gap-3 px-3.5 py-3"
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className="flex size-11 shrink-0 items-center justify-center rounded-md"
          role="checkbox"
          aria-checked={item.done}
        >
          <span
            className={`flex size-5 items-center justify-center rounded-sm border ${
              item.done ? 'border-field-600 bg-field-50' : 'border-neutral-300 bg-white'
            }`}
          >
            {item.done && <Check className="size-3.5 text-field-600" />}
          </span>
        </button>

        <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
          <span className="truncate text-sm leading-5 font-bold text-neutral-900">{item.label}</span>
          <span className="flex items-center gap-1.5">
            {aiPending && <Sparkles className="size-3.5 shrink-0 text-ai-700" />}
            <span
              className={`text-xs leading-[18px] font-medium ${
                aiPending ? 'text-ai-700' : item.done ? 'text-field-700' : 'text-neutral-600'
              }`}
            >
              {sub}
            </span>
            {photo && item.done && photos.length > 0 && (
              <ChevronDown
                className={`size-3.5 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            )}
          </span>
        </span>

        {/* 純視覺提示：整條都能點，這顆只是告訴你點下去會發生什麼 */}
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-md bg-white ${
            aiPending ? 'text-ai-700' : 'text-neutral-700'
          }`}
          aria-hidden="true"
        >
          <ActionIcon className="size-5" />
        </span>
      </div>

      {/* 拍完照後點圖片鈕：就地展開這一項拍到的照片 */}
      {expanded && photo && photos.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-field-200 px-3.5 py-3">
          <p className="text-xs leading-[18px] font-medium text-neutral-500">
            本項已拍攝 {photos.length} 張
          </p>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={p.id} className="flex w-[92px] flex-col gap-1">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm">
                  <PhotoArt seed={i} className="size-full" />
                  {p.tags?.some((t) => t.x != null) && (
                    <span className="absolute right-1 bottom-1 rounded-full bg-black/55 px-1.5 text-xs leading-[18px] font-medium text-white">
                      {p.tags.filter((t) => t.x != null).length} 標記
                    </span>
                  )}
                </div>
                <p className="truncate text-xs leading-[18px] font-medium text-neutral-600">
                  {p.label}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('f7')}
            className="self-start text-xs leading-[18px] font-bold text-field-700 underline"
          >
            到照片頁做更多標記
          </button>
        </div>
      )}
    </div>
  )
}

/* ── F4 AI 整理摘要分頁 ── */
function SummaryHead({ Icon, title }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Icon className="size-6 text-field-700" />
      <p className="flex-1 text-base leading-6 font-bold text-field-700">{title}</p>
      <AiBadge />
    </div>
  )
}

function AiSummaryPane({ summary, setSummary, hasTranscript }) {
  const set = (k) => (e) => setSummary((v) => ({ ...v, [k]: e.target.value }))
  return (
    <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-[18px] pb-6">
      {!hasTranscript && (
        <div className="shrink-0 rounded-sm bg-field-50 px-3 py-2.5">
          <p className="text-xs leading-[18px] font-medium text-field-700">
            以下為 AI 依逐字稿整理的內容示意；開始錄音後會依實際對話更新。
          </p>
        </div>
      )}

      <SummaryHead Icon={FileText} title="稽查概況" />
      <Textarea rows={3} value={summary.overview} onChange={set('overview')} className="shrink-0 text-sm" />

      <SummaryHead Icon={Star} title="重要發現" />
      <div className="flex shrink-0 gap-4 rounded-md border border-neutral-200 bg-white px-3 py-2.5 shadow-xs">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-sm leading-5 font-medium text-field-600">環境紀錄</p>
          <Textarea
            rows={3}
            value={summary.env}
            onChange={set('env')}
            className="border-0 px-0 py-0 text-xs leading-[18px] shadow-none"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-sm leading-5 font-medium text-field-600">動物狀況</p>
          <Textarea
            rows={3}
            value={summary.animal}
            onChange={set('animal')}
            className="border-0 px-0 py-0 text-xs leading-[18px] shadow-none"
          />
        </div>
      </div>

      <SummaryHead Icon={MessageCircle} title="當事人陳述" />
      <div className="flex shrink-0 flex-col gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2.5 shadow-xs">
        <Textarea
          rows={2}
          value={summary.quote}
          onChange={set('quote')}
          className="border-0 px-0 py-0 text-sm shadow-none"
        />
        <span className="self-end rounded-md border border-field-200 bg-field-50 px-2 py-1 text-xs leading-[18px] font-medium text-field-700">
          飼主陳述 10:35:10
        </span>
      </div>

      <SummaryHead Icon={BarChart2} title="查驗與蒐證結果" />
      <div className="flex shrink-0 flex-col gap-0.5 rounded-md border border-neutral-200 bg-white px-3 py-2.5 shadow-xs">
        {[
          ['現場動物數量：', '犬隻 1 隻'],
          ['晶片號碼：', '900115000530794'],
          ['登記資料：', '等待比對'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-xs leading-[18px] text-neutral-600">{k}</span>
            <span className="text-sm leading-5 font-medium text-neutral-900">{v}</span>
          </div>
        ))}
      </div>

      <SummaryHead Icon={Clipboard} title="現場處置與約定" />
      <div className="flex shrink-0 flex-col gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2.5 shadow-xs">
        <Textarea
          rows={3}
          value={summary.statement}
          onChange={set('statement')}
          className="border-0 px-0 py-0 text-sm shadow-none"
        />
        <span className="self-end rounded-md border border-field-200 bg-field-50 px-2 py-1 text-xs leading-[18px] font-medium text-field-700">
          動檢員 10:36:55
        </span>
      </div>
    </div>
  )
}

/* ── F8 筆記本彈窗 ── */
function NotebookModal({ open, notes, onClose, onAdd, onRemove }) {
  const [draft, setDraft] = useState('')
  if (!open) return null

  const commit = () => {
    const text = draft.trim()
    if (!text) return
    onAdd(text)
    setDraft('')
  }

  return (
    <Modal open onClose={onClose} width={560}>
      <div className="flex flex-col gap-4 px-7 py-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <BookOpen className="size-6 text-neutral-900" />
              <p className="text-lg leading-7 font-bold text-neutral-900">筆記本</p>
            </div>
            <p className="text-sm leading-5 text-neutral-400">
              現場即時記錄，將作為 AI 統整的重要依據
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md bg-field-600 px-[18px] py-2.5 text-sm leading-5 font-bold text-white"
          >
            完成
          </button>
        </div>

        <div className="h-px w-full bg-neutral-200" />
        <p className="text-sm leading-5 text-neutral-600">已記錄 {notes.length} 件</p>

        <div className="flex flex-col gap-2">
          {notes.map((n, i) => (
            <div
              key={n.id}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-canvas py-3 pr-3 pl-3.5"
            >
              <span className="text-sm leading-5 font-bold text-neutral-400">{i + 1}.</span>
              <span className="min-w-0 flex-1 text-sm leading-5 text-neutral-900">{n.text}</span>
              <button
                onClick={() => onRemove(n.id)}
                className="text-neutral-400 hover:text-danger"
                aria-label="刪除"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-3 rounded-lg border-[1.5px] border-field-600 bg-white py-3 pr-3 pl-3.5">
            <span className="text-sm leading-5 font-bold text-field-600">{notes.length + 1}.</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commit()}
              placeholder="輸入內容後按 Enter 新增下一筆…"
              className="min-w-0 flex-1 text-sm leading-5 text-neutral-900 outline-none placeholder:text-neutral-400"
            />
          </div>
        </div>

        <button
          onClick={commit}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-field-600 py-[11px] text-sm leading-5 text-field-600"
        >
          <span className="font-bold">＋</span>
          <span className="font-medium">新增一筆</span>
        </button>
      </div>
    </Modal>
  )
}

/* ═══════════ F11 文字紀錄與檢核彈窗 ═══════════
   Figma F11「文字摘要與檢測確認」(11088:1292) 的兩欄版型：左邊作答、右邊已錄音資訊。

   ★ 左欄從「一個大文字框」改成模組化題目（單選／複選／數字／填空）——
     現場戴著手套、單手拿平板，打字是最貴的動作，能點就不要打。
   ★ AI 聽到逐字稿對應內容時會先把答案填好，**顯示成紫色**；
     動檢員改動或按確認後轉成黑色。保存＝完成審核，所有紫色一併轉黑。
     這是整個系統的核心邏輯：AI 先寫，動檢員做最後審核。 */
function RecordModal({ item, aiLine, relatedLine, saved, onClose, onSave }) {
  const [form, setForm] = useState({ values: {}, ai: {} })
  const [guideOpen, setGuideOpen] = useState(false)

  /* 開啟時決定初值：已存過就沿用；沒存過但 AI 有聽到 → 用 AI 的答案並標成紫色 */
  useEffect(() => {
    if (!item) return
    if (saved) return setForm(saved)
    const schema = recordFormFor(item.id)
    const prefill = aiLine ? schema.ai : {}
    setForm({
      values: { ...prefill },
      ai: Object.fromEntries(Object.keys(prefill).map((k) => [k, true])),
    })
  }, [item, saved, aiLine])

  if (!item) return null

  const schema = recordFormFor(item.id)
  const words = KEYWORDS[item.id] ?? []
  const pendingKeys = Object.keys(form.ai).filter((k) => form.ai[k])
  const line = aiLine ?? relatedLine

  /* 任何一次動到欄位，就代表動檢員看過了 → 這格轉黑 */
  const setValue = (key, value) =>
    setForm((f) => ({ ...f, values: { ...f.values, [key]: value }, ai: { ...f.ai, [key]: false } }))
  const confirmAll = () => setForm((f) => ({ ...f, ai: {} }))

  const answered = schema.fields.filter((f) => {
    const v = form.values[f.key]
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== ''
  }).length

  return (
    <Modal open onClose={onClose} width={1060}>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start gap-4">
          <Edit className="mt-0.5 size-[30px] shrink-0 text-neutral-700" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-xl leading-[30px] font-bold text-neutral-900">{item.label}</p>
            <p className="text-xs leading-[18px] font-medium text-neutral-500">
              {item.group}｜已填 {answered}／{schema.fields.length} 題
            </p>
          </div>
          {pendingKeys.length > 0 && <AiBadge>AI 已帶入 {pendingKeys.length} 題</AiBadge>}
          <button onClick={onClose} className="text-neutral-500" aria-label="關閉">
            <X className="size-6" />
          </button>
        </div>

        {/* AI 帶入時的審核提示列 */}
        {pendingKeys.length > 0 && (
          <div className="flex items-center gap-3 rounded-md border border-ai-200 bg-ai-50 px-4 py-2.5">
            <Sparkles className="size-5 shrink-0 text-ai-700" />
            <p className="min-w-0 flex-1 text-sm leading-5 font-medium text-ai-700">
              紫色欄位是 AI 依現場錄音自動帶入的，請確認內容正確後再保存。
            </p>
            <button
              onClick={confirmAll}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-ai-700 px-3.5 text-sm leading-5 font-bold text-white"
            >
              <Check className="size-4" />
              全部確認無誤
            </button>
          </div>
        )}

        <div className="flex items-stretch gap-4">
          {/* ── 左欄：模組化作答 ── */}
          <div className="scroll-thin flex max-h-[420px] min-w-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            {schema.fields.map((f) => (
              <RecordField
                key={f.key}
                field={f}
                value={form.values[f.key]}
                ai={!!form.ai[f.key]}
                onChange={(v) => setValue(f.key, v)}
              />
            ))}
          </div>

          {/* ── 右欄：已錄音資訊（Figma F11 右欄） ── */}
          <div className="flex w-[360px] shrink-0 flex-col gap-2.5">
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-md bg-neutral-100 px-3 py-4">
              <p className="text-base leading-6 font-bold text-field-600">已錄音資訊</p>
              <div className="flex flex-1 items-start rounded-md border border-neutral-200 bg-white px-3 py-2.5">
                <p className="text-sm leading-5 text-neutral-900">
                  {line
                    ? `[${line.t}] ${line.text}`
                    : '本項目尚未偵測到對應逐字稿，可直接手動填寫。'}
                </p>
              </div>
              <p className="text-xs leading-[18px] text-neutral-600">
                檢測關鍵詞：{words.join('、')}
              </p>
            </div>
            <button
              onClick={() => setGuideOpen(true)}
              className="flex shrink-0 items-center gap-4 rounded-md bg-field-50 py-3 pr-3 pl-6 text-left hover:bg-field-100"
            >
              <ThumbsUp className="size-[30px] shrink-0 text-field-600" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base leading-6 font-bold text-field-600">建議處置方式</span>
                <span className="text-xs leading-[18px] font-medium text-field-600">
                  給飼主看的優良飼養範例，可列印帶走
                </span>
              </span>
              <ExternalLink className="size-4 shrink-0 text-field-600" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md bg-neutral-200 px-3.5 py-2 text-sm leading-5 font-bold text-neutral-600 shadow-xs"
          >
            取消
          </button>
          <button
            onClick={() => onSave({ values: form.values, ai: {} })}
            className="rounded-md border border-field-600 bg-field-600 px-3.5 py-2 text-sm leading-5 font-bold text-white shadow-xs"
          >
            保存並完成此項
          </button>
        </div>
      </div>

      {guideOpen && <CareGuideModal item={item} onClose={() => setGuideOpen(false)} />}
    </Modal>
  )
}

/** 一題 —— 依 type 換成單選／複選／數字／填空；ai 為 true 時整題顯示紫色 */
function RecordField({ field, value, ai, onChange }) {
  const tone = ai
    ? 'border-ai-200 bg-ai-50 text-ai-700'
    : 'border-field-600 bg-field-50 text-neutral-900'

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <p className="text-sm leading-5 font-bold text-neutral-900">{field.label}</p>
        {ai && <Sparkles className="size-3.5 text-ai-700" />}
      </div>

      {field.type === 'radio' && (
        <div className="flex flex-wrap gap-2">
          {field.options.map((o) => (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={`rounded-full border px-3.5 py-1.5 text-sm leading-5 font-medium ${
                value === o ? tone : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <div className="flex flex-wrap gap-2">
          {field.options.map((o) => {
            const list = Array.isArray(value) ? value : []
            const on = list.includes(o)
            return (
              <button
                key={o}
                onClick={() => onChange(on ? list.filter((x) => x !== o) : [...list, o])}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm leading-5 font-medium ${
                  on ? tone : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span
                  className={`flex size-3.5 items-center justify-center rounded-xs border ${
                    on ? (ai ? 'border-ai-500 bg-ai-500' : 'border-field-600 bg-field-600') : 'border-neutral-300'
                  }`}
                >
                  {on && <Check className="size-2.5 text-white" strokeWidth="3" />}
                </span>
                {o}
              </button>
            )
          })}
        </div>
      )}

      {field.type === 'number' && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            className={`h-10 w-[120px] rounded-md border px-3 text-base leading-6 font-bold outline-none ${
              value === undefined || value === '' ? 'border-neutral-300 bg-white text-neutral-900' : tone
            }`}
          />
          {field.unit && (
            <span className="text-sm leading-5 font-medium text-neutral-600">{field.unit}</span>
          )}
        </div>
      )}

      {field.type === 'text' && (
        <textarea
          rows={2}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? '選填'}
          className={`w-full resize-none rounded-md border px-3.5 py-2.5 text-sm leading-5 outline-none placeholder:text-neutral-400 ${
            value ? tone : 'border-neutral-300 bg-white text-neutral-900'
          }`}
        />
      )}
    </div>
  )
}

/* ═══════════ 建議處置方式 / 優良飼養範例 ═══════════
   這個畫面的觀眾是**飼主**不是動檢員 —— 現場把平板轉過去給飼主看正確做法，
   比口頭勸導有效；離場前還可以列印一張帶 QR 的飼養建議單留給對方。
   內容依目前這個蒐證項目挑選，定義在 store/evidence.js 的 CARE_GUIDE。 */
function CareGuideModal({ item, onClose }) {
  const guide = careGuideFor(item.id)
  const [printing, setPrinting] = useState(false)

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      {printing ? (
        <PrintSheet guide={guide} onBack={() => setPrinting(false)} onClose={onClose} />
      ) : (
        <div className="relative flex max-h-[calc(100%-48px)] w-[880px] flex-col gap-4 rounded-xl bg-white p-6 shadow-xl">
          <div className="flex shrink-0 items-start gap-3">
            <ThumbsUp className="mt-0.5 size-7 shrink-0 text-field-600" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-xl leading-[30px] font-bold text-neutral-900">{guide.title}</p>
              <p className="text-xs leading-[18px] font-medium text-neutral-500">
                建議處置方式｜可轉向飼主說明
              </p>
            </div>
            <button onClick={onClose} className="text-neutral-500" aria-label="關閉">
              <X className="size-6" />
            </button>
          </div>

          <p className="shrink-0 rounded-md bg-field-50 px-4 py-3 text-sm leading-5 font-medium text-field-700">
            {guide.lead}
          </p>

          <div className="scroll-thin flex min-h-0 flex-1 gap-4 overflow-y-auto">
            <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-md border border-field-200 bg-white p-4">
              <p className="flex items-center gap-2 text-base leading-6 font-bold text-field-700">
                <Check className="size-5" />
                建議這樣做
              </p>
              <ul className="flex flex-col gap-2">
                {guide.good.map((g) => (
                  <li key={g} className="flex gap-2 text-sm leading-5 text-neutral-800">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-field-600" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>

            {guide.bad.length > 0 && (
              <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-4">
                <p className="flex items-center gap-2 text-base leading-6 font-bold text-danger">
                  <X className="size-5" />
                  現場常見問題
                </p>
                <ul className="flex flex-col gap-2">
                  {guide.bad.map((b) => (
                    <li key={b} className="flex gap-2 text-sm leading-5 text-neutral-700">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <p className="shrink-0 rounded-md bg-neutral-100 px-4 py-2.5 text-xs leading-[18px] font-medium text-neutral-600">
            {guide.law}
          </p>

          <div className="flex shrink-0 items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md bg-neutral-200 px-3.5 py-2 text-sm leading-5 font-bold text-neutral-600 shadow-xs"
            >
              關閉
            </button>
            <button
              onClick={() => setPrinting(true)}
              className="flex items-center gap-2 rounded-md bg-field-600 px-4 py-2.5 text-sm leading-5 font-bold text-white shadow-xs"
            >
              <Printer className="size-[18px]" />
              列印飼養建議給飼主
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** 列印預覽：A5 直式，內容＝摘要＋重點做法＋連到動保網飼養指南的 QR */
function PrintSheet({ guide, onBack, onClose }) {
  const { state } = useApp()
  const c = state.activeCase
  return (
    <div className="relative flex max-h-[calc(100%-48px)] w-[720px] flex-col gap-4 rounded-xl bg-white p-6 shadow-xl">
      <div className="flex shrink-0 items-center gap-3">
        <Printer className="size-6 shrink-0 text-neutral-900" />
        <p className="flex-1 text-xl leading-[30px] font-bold text-neutral-900">列印預覽</p>
        <button onClick={onClose} className="text-neutral-500" aria-label="關閉">
          <X className="size-6" />
        </button>
      </div>

      {/* 紙本內容 */}
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto rounded-md border border-neutral-300 bg-white p-7">
        <div className="flex items-start justify-between gap-4 border-b-2 border-field-900 pb-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-lg leading-7 font-bold text-field-900">飼養建議單</p>
            <p className="text-xs leading-[18px] text-neutral-600">
              新北市動物保護處　{c.reportedAt.slice(0, 6)} 現場稽查
            </p>
          </div>
          <p className="text-xs leading-[18px] text-neutral-500">案件 {c.id}</p>
        </div>

        <p className="mt-4 text-base leading-6 font-bold text-neutral-900">{guide.title}</p>
        <p className="mt-1.5 text-sm leading-5 text-neutral-700">{guide.lead}</p>

        <div className="mt-4 flex gap-6">
          <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
            {guide.good.map((g, i) => (
              <li key={g} className="flex gap-2 text-sm leading-5 text-neutral-900">
                <span className="shrink-0 font-bold text-field-700">{i + 1}.</span>
                {g}
              </li>
            ))}
          </ul>

          <div className="flex w-[136px] shrink-0 flex-col items-center gap-1.5">
            <QrArt />
            <p className="text-center text-xs leading-[18px] font-medium text-neutral-700">
              掃描看完整
              <br />
              飼養建議指南
            </p>
            <p className="text-center text-[10px] leading-[14px] break-all text-neutral-500">
              {CARE_GUIDE_URL}
            </p>
          </div>
        </div>

        <p className="mt-4 border-t border-neutral-300 pt-3 text-xs leading-[18px] text-neutral-600">
          法令依據：{guide.law}
        </p>
        <p className="mt-1.5 text-xs leading-[18px] text-neutral-500">
          如有疑問請洽新北市動物保護處 02-2959-6353，或撥打 1959 全國動物保護專線。
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3">
        <p className="text-xs leading-[18px] font-medium text-neutral-500">
          A5 直式・一頁｜列印後請飼主簽收（非強制）
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-md bg-neutral-200 px-3.5 py-2 text-sm leading-5 font-bold text-neutral-600 shadow-xs"
          >
            返回
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-md bg-field-600 px-4 py-2.5 text-sm leading-5 font-bold text-white shadow-xs"
          >
            <Printer className="size-[18px]" />
            送出列印
          </button>
        </div>
      </div>
    </div>
  )
}

/*
  QR 示意圖 —— 三個定位方塊 ＋ 由固定亂數展開的模組。
  ⚠️ 這是視覺佔位，不是可掃描的 QR：原型不引外部函式庫（離線 demo 要能跑），
     實作階段請改用真正的 QR 產生器編碼 CARE_GUIDE_URL。網址已同時以文字印在下方。
*/
function QrArt() {
  const n = 21
  const cells = []
  let seed = 20260811
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  const inFinder = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (inFinder(r, c)) continue
      if (rand() > 0.55) cells.push([r, c])
    }
  }
  const finder = (r, c) => (
    <g key={`f${r}${c}`}>
      <rect x={c} y={r} width="7" height="7" fill="currentColor" />
      <rect x={c + 1} y={r + 1} width="5" height="5" fill="#fff" />
      <rect x={c + 2} y={r + 2} width="3" height="3" fill="currentColor" />
    </g>
  )
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="size-[120px] text-neutral-900">
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" />
      {finder(0, 0)}
      {finder(0, n - 7)}
      {finder(n - 7, 0)}
      {cells.map(([r, c]) => (
        <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="currentColor" />
      ))}
    </svg>
  )
}
