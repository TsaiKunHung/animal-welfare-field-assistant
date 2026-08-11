import { useEffect, useMemo, useRef, useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { AiBadge, Modal, Textarea } from '../components/ui.jsx'
import {
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  Cloud,
  CloudOff,
  Edit,
  FileText,
  Images,
  Mic,
  Pause,
  Play,
  Plus,
  Search,
  Square,
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

/* ── 本頁缺的圖示（icons.jsx 沒有；避免多個 subagent 同時改共用檔） ── */
function Svg({ children, className = 'size-6', ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  )
}
const BookOpen = (p) => (
  <Svg {...p}>
    <path d="M12 7v14M12 7a4 4 0 00-4-4H3v14h5a4 4 0 014 4M12 7a4 4 0 014-4h5v14h-5a4 4 0 00-4 4" />
  </Svg>
)
const Bookmark = (p) => (
  <Svg {...p}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </Svg>
)
const ThumbsUp = (p) => (
  <Svg {...p}>
    <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3M7 11l4-9a3 3 0 013 3v4h5.5a2 2 0 011.96 2.4l-1.4 7A2 2 0 0118.1 21H7z" />
  </Svg>
)
const ExternalLink = (p) => (
  <Svg {...p}>
    <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
  </Svg>
)
const Star = (p) => (
  <Svg {...p}>
    <path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3z" />
  </Svg>
)
const MessageCircle = (p) => (
  <Svg {...p}>
    <path d="M21 11.5a8.4 8.4 0 01-9 8.5 8.6 8.6 0 01-3.9-.9L3 21l1.9-5.1A8.4 8.4 0 013.5 11 8.4 8.4 0 0112 3a8.4 8.4 0 019 8.5z" />
  </Svg>
)
const BarChart = (p) => (
  <Svg {...p}>
    <path d="M6 20V10M12 20V4M18 20v-6" />
  </Svg>
)
const Clipboard = (p) => (
  <Svg {...p}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
  </Svg>
)

/* ── 左側工具列：Figma 稿面是「五個」工具（第五個是筆記本，開本頁彈窗） ── */
const TOOLS = [
  { key: 'f5', label: '飼主身分查詢', Icon: User },
  { key: 'f6', label: '寵物晶片查詢', Icon: Search },
  { key: 'f7', label: '瀏覽案件照片', Icon: Images },
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

/* 波形柱高（Figma Field recording bar / Waveform） */
const WAVE = [10, 18, 28, 16, 34, 22, 12, 30, 20, 36, 16, 26, 12, 32, 18, 24, 14, 28, 10, 20, 34, 16, 22, 12]

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
  const [tick, setTick] = useState(0)

  /* 逐字稿播放進度 */
  const [cursor, setCursor] = useState(0)
  const scrollRef = useRef(null)

  /* 分頁 / 面板 / 彈窗 */
  const [tab, setTab] = useState('raw') // raw | ai
  const [notebookOpen, setNotebookOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [detect, setDetect] = useState(null) // F11 彈窗 payload
  const [collapsed, setCollapsed] = useState({})
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState('')

  /* ── 計時器：錄音中每秒 +1，同時讓波形跳動 ── */
  useEffect(() => {
    if (status !== 'recording') return
    const id = setInterval(() => {
      setElapsed((v) => v + 1)
      setTick((v) => v + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [status])

  /* ── 逐字稿自動長出來：每 2.4 秒一句；跳出 F11 彈窗時暫停，關掉後續播 ── */
  useEffect(() => {
    if (status !== 'recording' || detect || cursor >= SCRIPT.length) return
    const id = setTimeout(() => {
      const line = SCRIPT[cursor]
      dispatch({
        type: 'PUSH_TRANSCRIPT',
        payload: { t: line.t, speaker: line.speaker, text: line.text, marked: false },
      })
      setCursor((v) => v + 1)
      if (line.trigger) setDetect({ checkId: line.trigger, line })
    }, 2400)
    return () => clearTimeout(id)
  }, [status, detect, cursor, dispatch])

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
  const saveDetect = () => {
    if (detect) dispatch({ type: 'TOGGLE_CHECK', id: detect.checkId, done: true })
    setDetect(null)
  }
  const addItem = () => {
    const label = newItem.trim()
    if (!label) return setAdding(false)
    dispatch({
      type: 'ADD_CHECK_ITEM',
      payload: { id: `tmp-${Date.now()}`, group: '現場臨時項目', label, done: false, photos: [] },
    })
    setNewItem('')
    setAdding(false)
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
          <div className="flex h-[88px] shrink-0 items-center justify-between px-5 py-3.5">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl leading-[30px] font-bold text-neutral-900">
                「{c.type}」蒐證清單
              </h2>
              <p className="text-xs leading-[18px] font-medium text-neutral-500">
                已完成 {checklistDone}／{checklistTotal}｜現場可新增臨時項目
              </p>
            </div>
            <button
              onClick={() => setAdding(true)}
              className="flex h-9 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 text-sm leading-5 font-bold text-field-700 shadow-xs"
            >
              <Plus className="size-4" />
              新增臨時項目
            </button>
          </div>

          <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-1 pb-6">
            {adding && (
              <div className="flex shrink-0 items-center gap-2 rounded-md border border-field-600 bg-white px-3.5 py-3">
                <input
                  autoFocus
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder="輸入臨時蒐證項目後按 Enter"
                  className="flex-1 text-sm leading-5 outline-none placeholder:text-neutral-400"
                />
                <button onClick={addItem} className="text-sm leading-5 font-bold text-field-700">
                  新增
                </button>
                <button onClick={() => setAdding(false)} className="text-neutral-400">
                  <X className="size-4" />
                </button>
              </div>
            )}

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
                    g.items.map((item) => (
                      <EvidenceRow
                        key={item.id}
                        item={item}
                        onToggle={() => dispatch({ type: 'TOGGLE_CHECK', id: item.id })}
                        onAction={() =>
                          isPhotoItem(item.label)
                            ? navigate('f10')
                            : setDetect({ checkId: item.id, line: lastMatch(state.transcript, item.id) })
                        }
                      />
                    ))}
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

        <div className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1">
          {WAVE.map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-[2px] transition-all duration-300 ${
                status === 'recording' ? 'bg-field-400' : 'bg-neutral-300'
              }`}
              style={{ height: status === 'recording' ? WAVE[(i + tick) % WAVE.length] : Math.max(6, h / 3) }}
            />
          ))}
        </div>

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
                <Square className="size-[22px]" />
                結束錄音
              </button>
            </>
          )}
        </div>
      </footer>

      {/* ── F11 文字摘要與檢測確認彈窗 ── */}
      <DetectModal
        detect={detect}
        checklist={state.checklist}
        onClose={() => setDetect(null)}
        onSave={saveDetect}
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

/* ── 蒐證清單單列 Evidence row ── */
function EvidenceRow({ item, onToggle, onAction }) {
  const photo = isPhotoItem(item.label)
  const ActionIcon = item.done ? Images : photo ? Camera : Edit
  const sub = item.done
    ? photo
      ? `已完成｜${item.photos.length || 1} 張照片`
      : '已完成｜內容已記錄'
    : photo
      ? '需要照片'
      : '需要文字紀錄'

  return (
    <div
      className={`flex h-[82px] shrink-0 items-center gap-3 rounded-md border px-3.5 py-3 ${
        item.done ? 'border-field-200 bg-field-50' : 'border-neutral-200 bg-white'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex size-10 shrink-0 items-center justify-center rounded-md"
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
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm leading-5 font-bold text-neutral-900">{item.label}</p>
        <p
          className={`text-xs leading-[18px] font-medium ${
            item.done ? 'text-field-700' : 'text-neutral-600'
          }`}
        >
          {sub}
        </p>
      </div>
      <button
        onClick={onAction}
        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white"
        aria-label={photo ? '拍照' : '編輯文字紀錄'}
      >
        <ActionIcon className="size-5 text-neutral-700" />
      </button>
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

      <SummaryHead Icon={BarChart} title="查驗與蒐證結果" />
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

/* ── F11 文字摘要與檢測確認彈窗 ── */
function DetectModal({ detect, checklist, onClose, onSave }) {
  if (!detect) return null
  const item = checklist.find((i) => i.id === detect.checkId)
  const words = KEYWORDS[detect.checkId] ?? []
  const line = detect.line

  return (
    <Modal open onClose={onClose} width={1130}>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start gap-4">
          <Edit className="size-[30px] shrink-0 text-neutral-700" />
          <p className="flex-1 text-xl leading-[30px] font-bold text-neutral-900">
            {item?.label ?? '文字摘要與檢測確認'}
          </p>
          <button onClick={onClose} className="text-neutral-500" aria-label="關閉">
            <X className="size-6" />
          </button>
        </div>

        <div className="flex items-stretch gap-4">
          {/* 左欄：已錄音資訊 */}
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-md bg-neutral-100 px-3 py-4">
            <p className="text-base leading-6 font-bold text-field-600">已錄音資訊</p>
            <div className="flex flex-1 items-start rounded-md border border-neutral-200 bg-white px-3 py-2.5">
              <p className="text-sm leading-5 text-neutral-900">
                {line ? `[${line.t}] ${line.text}` : '本項目尚未偵測到對應逐字稿，可直接手動確認。'}
              </p>
            </div>
          </div>

          {/* 右欄：內容檢測成功 ＋ 建議處置方式 */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
            <div className="flex items-center gap-4 rounded-md bg-neutral-100 py-4 pr-3 pl-6">
              <Check className="size-9 shrink-0 text-field-600" />
              <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                <p className="text-base leading-6 font-bold text-field-600">內容檢測成功</p>
                <p className="text-sm leading-5 font-medium text-neutral-700">
                  已偵測到逐字稿中「{item?.group ?? '現場紀錄'}」相關資料，請核對。
                </p>
                <p className="text-xs leading-[18px] text-neutral-600">
                  檢測關鍵詞：{words.join('、')}
                </p>
              </div>
            </div>
            <button className="flex items-center gap-4 rounded-md bg-field-50 py-3 pr-3 pl-6 text-left">
              <ThumbsUp className="size-[30px] shrink-0 text-field-600" />
              <span className="flex-1 text-base leading-6 font-bold text-field-600">建議處置方式</span>
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
            onClick={onSave}
            className="rounded-md border border-field-600 bg-field-600 px-3.5 py-2 text-sm leading-5 font-bold text-white shadow-xs"
          >
            保存
          </button>
        </div>
      </div>
    </Modal>
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
