import { useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { AiBadge, Placeholder } from '../components/ui.jsx'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Cloud,
  BookOpen,
  FileText,
  Image,
  Lock,
  MoreHorizontal,
  Search,
  User,
  X,
} from '../components/icons.jsx'

/*
  F9 案件內容 — Figma page 10904:2468
    F9-1   外勤小助手 / 現場蒐證與紀錄 / 案件內容頁 (10957:3729) → 主畫面
    F9-1-1 案件內容頁 / 報案人資訊展開             (11421:3734) → reporterOpen

  ⚠️ Figma 的 F9 是「F3 工作台 + 置中彈窗」整頁 frame；本專案 f9 是獨立路由，
     所以照 F5 的做法：自己畫一層工作台襯底，彈窗疊在上面（同一個 route，useState 切狀態）。
     襯底刻意做成靜態的，真正的工作台在 F3 —— 這裡不重複實作互動，也不修改 F3。
  ⚠️ Figma 稿面沿用舊案（0927492927 四維路米克斯貓／台北市大安區／2025/03/23），
     一律改成 state.activeCase（AC-1150811-003 文化路米克斯犬／新北市板橋區／民國 115 年）。
  ⚠️ 左欄唯讀、右欄可編輯 —— 這頁的重點是「蒐證階段仍可隨時回頭補充編輯案件詳細資訊」。
*/

/* 圖示一律用共用 icons.jsx（Feather），本頁不自繪。 */

const TOOLS = [
  { key: 'f5', label: '飼主身分查詢', Icon: User },
  { key: 'f6', label: '寵物晶片查詢', Icon: Search },
  { key: 'f7', label: '瀏覽案件照片', Icon: Image },
  { key: 'f9', label: '案件內容', Icon: FileText },
  { key: 'notebook', label: '筆記本', Icon: BookOpen },
]


/* 右欄初值（Figma F9 右欄文案，改成本案的犬隻情境與新北市） */
const INITIAL_FORM = {
  reminder:
    '不當飼養案件在現場勘查時，應詳細觀察動物的飲食、飲水、活動空間與健康狀態，並留意是否有充足、乾淨之飲水與食物，皆須妥善記錄與拍照。現場人員應儘量以不干擾動物的方式進行拍攝，並以影片及照片完整記錄動物行為與環境現況。',
  equipment:
    '捕犬網、晶片掃描器、拍攝用具、防咬手套。\n捲尺、溫度計。\n可攜式飲水器、毛巾、與消毒用品。',
  points:
    '重點拍攝並記錄居住環境整潔度、飼料與飲水狀態、飼養空間大小與通風情形，同時觀察動物皮膚、毛髮、體態與行為反應。\n若有異味、排泄物堆積、或明顯長期未清理情形，應詳細標註位置與時間。\n如有鄰居反映，應同步記錄陳述內容、音量狀況與噪音持續時間以利研判干擾程度。',
  remark:
    '由於案件地點位於住宅區，鄰里關係較為敏感，建議出勤時保持低調、不著制服外露標誌，並優先與里長或管委會窗口聯繫協調。\n如現場遭遇民眾情緒對立，應以平和溝通、避免爭執為原則，並於調查後即時上傳紀錄與回報處理狀況。\n若動物有生命危險或疑似遭虐，請即刻聯絡警政支援並依「動保緊急應變流程」處理。',
}

const REF_CASES = [
  {
    title: '板橋區公寓陽台犬隻不當飼養案',
    tag: '已裁罰',
    body: '飼主長期將犬隻關在陽台鐵籠，未提供足夠飲水與遮蔽，經查獲後依動保法第 5 條裁罰並限期改善。',
    meta: '案件編號：AC-1140617-021　年份：民國 114 年',
  },
  {
    title: '樹林區民宅犬隻圈養未清理案',
    tag: null,
    body: '飼養空間排泄物長期堆積、通風不良，經檢舉後先行改善勸導並安排 30 日後複查。',
    meta: '案件編號：AC-1141102-008　年份：民國 114 年',
  },
]

const LAW_ARTICLES = [
  {
    no: '第 5 條',
    lead: '飼主對於其管領之動物，應依下列規定辦理：',
    items: [
      '一、 提供適當、乾淨且無害之食物及二十四小時充足、乾淨之飲水。',
      '二、 提供安全、乾淨、通風、排水、適當及適量之遮蔽、照明與溫度之生活環境。',
      '三、 提供法定動物傳染病之必要防治。',
      '四、 避免其遭受騷擾、虐待或傷害。',
      '五、 以籠子飼養寵物者，其籠內空間應足供寵物充分伸展，並應提供充分之籠外活動時間。',
    ],
  },
  {
    no: '第 30 條',
    lead: '有下列情事之一者，處新臺幣三千元以上一萬五千元以下罰鍰，並得限期令其改善；屆期未改善者，得按次處罰之：',
    items: [
      '一、 違反第五條第二項規定，未提供動物適當、乾淨且無害之食物及二十四小時充足、乾淨之飲水，或未提供安全、乾淨、通風、排水、適當及適量之遮蔽、照明與溫度之生活環境。',
      '二、 違反第五條第三項規定，棄養動物。',
    ],
  },
]

const PHOTOS = ['照片 1', '照片 2', '照片 3']

/* ── 小元件 ── */

function Divider() {
  return <div className="h-px w-full shrink-0 bg-neutral-200" />
}

function InfoRow({ label, value, right }) {
  return (
    <div className="flex w-full shrink-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-start text-sm leading-5 font-medium">
        <span className="w-[76px] shrink-0 text-neutral-500">{label}</span>
        <span className="text-neutral-800">{value}</span>
      </div>
      {right}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <p className="w-full shrink-0 text-xl leading-[30px] font-bold text-field-900">{children}</p>
  )
}

/** 右欄段落標題（Figma Text lg/Semibold 18/28） */
function FormLabel({ children, hint }) {
  return (
    <div className="flex w-full shrink-0 items-center justify-between gap-2">
      <p className="text-lg leading-7 font-bold text-neutral-900">{children}</p>
      {hint}
    </div>
  )
}

/** 可編輯的多行欄位 —— 這頁的核心語意：蒐證階段仍可隨時回頭補充 */
function EditableBox({ value, onChange, rows = 4, list = false }) {
  const [editing, setEditing] = useState(false)

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex w-full shrink-0 items-start rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-left shadow-xs hover:border-field-600"
      >
        {list ? (
          <ul className="flex flex-1 list-disc flex-col gap-3 ps-[21px] text-sm leading-5 text-neutral-900">
            {value
              .split('\n')
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
        ) : (
          <p className="flex-1 text-sm leading-5 whitespace-pre-line text-neutral-900">{value}</p>
        )}
      </button>
    )
  }

  return (
    <textarea
      autoFocus
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      className="w-full shrink-0 resize-none rounded-md border border-field-600 bg-white px-4 py-2.5 text-sm leading-5 text-neutral-900 shadow-xs outline-none"
    />
  )
}

/** 右欄的 select / 開窗列（Figma「案件類型：Select menu」樣式） */
function SelectRow({ children, trailing, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[52px] w-full shrink-0 items-center justify-between rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-left"
    >
      <span className="text-base leading-6 font-medium text-neutral-900">{children}</span>
      {trailing}
    </button>
  )
}

export default function F9CaseContent() {
  const { state, checklistDone, checklistTotal } = useApp()
  const c = state.activeCase

  const [reporterOpen, setReporterOpen] = useState(false) // F9-1-1
  const [form, setForm] = useState(INITIAL_FORM)
  const caseType = c.type // 唯讀：案件類型由 1959 派案決定，外勤端不可改
  const [historyOpen, setHistoryOpen] = useState(false)
  const [refOpen, setRefOpen] = useState(false)
  const [lawOpen, setLawOpen] = useState(false)
  const [dirty, setDirty] = useState(false)

  const set = (key) => (v) => {
    setForm((f) => ({ ...f, [key]: v }))
    setDirty(true)
  }

  const close = () => navigate('f3')

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas">
      {/* ── 工作台襯底（靜態；真正的互動在 F3） ── */}
      <WorkbenchBackdrop
        state={state}
        checklistDone={checklistDone}
        checklistTotal={checklistTotal}
        onBack={close}
      />

      {/* ── 案件內容彈窗（Figma「飼主身分查詢對話框/案件內容」11278:4663） ── */}
      <div className="absolute inset-0 z-30 flex items-center justify-center px-6 py-5">
        <div className="absolute inset-0 bg-black/[0.32]" onClick={close} />

        <div className="relative flex max-h-full w-[869px] flex-col gap-4 overflow-hidden rounded-md bg-white p-6 shadow-lg">
          {/* 標題列 */}
          <div className="flex shrink-0 items-start gap-3">
            <FileText className="size-[30px] shrink-0 text-neutral-900" />
            <p className="flex-1 text-xl leading-[30px] font-bold text-neutral-900">案件內容</p>
            {dirty && (
              <span className="flex items-center gap-1.5 rounded-full bg-field-50 px-2.5 py-1 text-xs leading-[18px] font-bold text-field-700">
                <Check className="size-3.5" />
                已即時儲存
              </span>
            )}
            <button onClick={close} className="text-neutral-900" aria-label="關閉">
              <X className="size-6" />
            </button>
          </div>

          {/* Figma 的內容區 551 高；外層 max-h-full 會在視窗變矮時讓它自動收縮，不寫死整頁高度 */}
          <div className="flex h-[551px] max-h-full min-h-0 items-stretch justify-center gap-4">
            {/* ── 左欄：唯讀案件資訊 ── */}
            <div className="scroll-thin flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto rounded-md border border-field-100 bg-field-50 px-6 py-3">
              <div className="flex w-full shrink-0 flex-col items-start py-[5px]">
                <span className="inline-flex h-7 items-center gap-[5px] rounded-full bg-danger pr-3.5 pl-2.5 text-white">
                  <span className="text-xs font-bold">!</span>
                  <span className="text-[13px] font-medium">緊急</span>
                </span>
                <p className="mt-1 text-xl leading-[30px] font-bold text-field-900">{c.title}</p>
              </div>

              <Divider />

              <InfoRow label="報案時間：" value={c.reportedAt} />
              {/* 稿面這裡有一顆「唯讀」徽章，實作拿掉 —— 左欄整欄本來就不可編輯，
                  單獨標一個欄位反而讓人以為其他欄位可以改 */}
              <InfoRow label="地址：" value={c.address} />

              <div className="flex w-full shrink-0 items-center justify-between">
                <span className="text-sm leading-5 font-medium text-neutral-500">報案人：</span>
                <button
                  onClick={() => setReporterOpen((v) => !v)}
                  className="flex size-6 items-center justify-center text-neutral-700"
                  aria-label="展開報案人資訊"
                >
                  {reporterOpen ? <ChevronUp className="size-6" /> : <ChevronDown className="size-6" />}
                </button>
              </div>

              {/* F9-1-1 報案人資訊展開 */}
              {reporterOpen && (
                <div className="flex w-full shrink-0 flex-col gap-2 rounded-md border border-neutral-200 bg-white px-4 py-3 shadow-xs">
                  <p className="w-full text-center text-base leading-6 font-bold text-neutral-900">
                    報案人資訊
                  </p>
                  <div className="flex flex-col gap-0.5 text-sm leading-5">
                    <p className="text-neutral-500">
                      <span className="inline-block w-[72px]">姓名</span>
                      <span className="text-neutral-900">{c.reporter.name}</span>
                    </p>
                    <p className="text-neutral-500">
                      <span className="inline-block w-[72px]">電話</span>
                      <span className="text-neutral-900">{c.reporter.phone}</span>
                    </p>
                    <p className="text-neutral-500">
                      <span className="inline-block w-[72px]">檢舉管道</span>
                      <span className="text-neutral-900">{c.reporter.channel}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Check className="size-[21px] text-field-300" />
                    <span className="text-sm leading-5 text-field-300">可陪同現場</span>
                  </div>
                </div>
              )}

              <Divider />

              <SectionTitle>陳情人描述：</SectionTitle>
              <p className="w-full shrink-0 py-2.5 text-sm leading-5 text-neutral-800">
                {c.description}
              </p>

              <Divider />

              <SectionTitle>動物資訊：</SectionTitle>
              <div className="flex shrink-0 items-start gap-[22px]">
                <div className="flex w-[31px] flex-col gap-3 text-sm leading-5 font-medium whitespace-nowrap text-neutral-500">
                  <span>種類</span>
                  <span>特徵</span>
                  <span>數量</span>
                </div>
                <div className="flex w-[120px] flex-col gap-3 text-sm leading-5 font-medium text-neutral-800">
                  <span>{c.animal.species}</span>
                  <span>
                    {c.animal.breed}、{c.animal.gender}
                  </span>
                  <span>{c.animal.count} 隻</span>
                </div>
              </div>

              <Divider />

              <SectionTitle>案件摘要：</SectionTitle>
              <p className="w-full shrink-0 py-2.5 text-sm leading-5 text-neutral-800">{c.summary}</p>

              <Divider />

              <SectionTitle>附圖：</SectionTitle>
              <div className="flex w-full shrink-0 flex-col gap-[7px] rounded-md border border-neutral-200 bg-neutral-50 p-2.5">
                <div className="flex h-5 w-full items-center justify-between">
                  <span className="flex-1 text-sm leading-5 font-bold text-neutral-700">原始附件</span>
                  <span className="text-xs leading-[18px] font-medium text-field-700">
                    {PHOTOS.length} 份・報案時上傳
                  </span>
                </div>
                <div className="flex h-[69px] w-full items-start gap-1.5">
                  {PHOTOS.map((label) => (
                    <div
                      key={label}
                      className="relative flex h-[69px] flex-1 flex-col justify-end overflow-hidden rounded-sm"
                    >
                      <Placeholder label="" tone="photo" className="absolute inset-0" />
                      <div className="relative flex w-full items-center bg-[rgba(0,0,0,0.55)] px-1.5 py-[3px]">
                        <span className="text-xs leading-[18px] font-medium text-white">{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 右欄：可編輯的案件詳細資訊 ── */}
            <div className="scroll-thin flex w-[431px] shrink-0 flex-col gap-3 overflow-y-auto px-5 pt-3 pb-6">
              <div className="flex shrink-0 items-start gap-2 rounded-md bg-field-50 px-3 py-2.5">
                <p className="flex-1 text-xs leading-[18px] font-medium text-field-700">
                  蒐證階段仍可隨時回頭補充：點任一欄位即可直接編輯，內容會即時帶回案件紀錄。
                </p>
              </div>

              {/* 案件類型是 1959 派案時就決定的，外勤端唯讀（原本是可改的 select，2026-08-11 移除）。
                  這一欄以下的提醒事項／器具準備／蒐證重點才是現場可編輯的。 */}
              <FormLabel>案件類型：</FormLabel>
              <div className="flex h-[52px] w-full shrink-0 items-center rounded-md border border-neutral-200 bg-neutral-50 px-3.5 py-2.5">
                <span className="text-base leading-6 font-medium text-neutral-900">{caseType}</span>
              </div>

              <FormLabel hint={<AiBadge>AI 整理</AiBadge>}>提醒事項：</FormLabel>
              <EditableBox value={form.reminder} onChange={set('reminder')} rows={6} />

              <FormLabel>器具準備：</FormLabel>
              <EditableBox value={form.equipment} onChange={set('equipment')} rows={4} />

              <FormLabel>蒐證重點提醒：</FormLabel>
              <EditableBox value={form.points} onChange={set('points')} rows={7} list />

              <FormLabel>過往案例提示：</FormLabel>
              <SelectRow
                onClick={() => setHistoryOpen((v) => !v)}
                trailing={
                  historyOpen ? (
                    <ChevronUp className="size-5 text-neutral-700" />
                  ) : (
                    <ChevronDown className="size-5 text-neutral-700" />
                  )
                }
              >
                過往紀錄<span className="text-field-600">（0）</span>
              </SelectRow>
              {historyOpen && (
                <div className="w-full shrink-0 rounded-md bg-neutral-100 px-3 py-2.5 text-sm leading-5 text-neutral-500">
                  本案地址目前查無過往案件紀錄。
                </div>
              )}

              <SelectRow
                onClick={() => setRefOpen((v) => !v)}
                trailing={<MoreHorizontal className="size-6 text-neutral-700" />}
              >
                可參考案例<span className="text-field-600">（{REF_CASES.length}）</span>
              </SelectRow>
              {refOpen && (
                <div className="flex w-full shrink-0 flex-col gap-3">
                  {REF_CASES.map((r) => (
                    <div key={r.title} className="flex flex-col gap-2 rounded-md bg-neutral-100 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm leading-5 font-bold text-black">{r.title}</p>
                        {r.tag && (
                          <span className="shrink-0 rounded-2xl bg-danger-bg px-2.5 py-0.5 text-xs leading-[18px] font-medium text-danger">
                            {r.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-[18px] text-black">{r.body}</p>
                      <p className="text-xs leading-[18px] text-neutral-600">{r.meta}</p>
                    </div>
                  ))}
                </div>
              )}

              <FormLabel>※ 相關法律內容：</FormLabel>
              <SelectRow
                onClick={() => setLawOpen((v) => !v)}
                trailing={<MoreHorizontal className="size-6 text-neutral-700" />}
              >
                相關條文說明
              </SelectRow>
              {lawOpen && (
                <div className="flex w-full shrink-0 flex-col gap-3">
                  {LAW_ARTICLES.map((a) => (
                    <div key={a.no} className="flex flex-col gap-2 rounded-md bg-neutral-100 px-3 py-2.5">
                      <p className="text-sm leading-5 font-bold text-black">
                        動物保護法 {a.no}
                      </p>
                      <p className="text-xs leading-[18px] font-bold text-black">{a.lead}</p>
                      <p className="text-xs leading-[18px] whitespace-pre-line text-black">
                        {a.items.join('\n')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <FormLabel>其他：</FormLabel>
              <EditableBox value={form.remark} onChange={set('remark')} rows={8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 工作台襯底：F3 的靜態縮影（不修改 F3，也不在這裡重做互動） ── */
function WorkbenchBackdrop({ state, checklistDone, checklistTotal, onBack }) {
  const c = state.activeCase
  const preview = state.checklist.slice(0, 6)

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-canvas">
      <header className="flex h-[72px] shrink-0 items-center justify-between bg-field-900 pr-9 pl-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex size-12 items-center justify-center rounded-lg border-2 border-field-700 text-white"
            aria-label="返回工作台"
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
          <span className="flex items-center gap-1.5 rounded-md bg-field-700 px-2.5 py-2">
            <Cloud className="size-[18px] text-white" />
            <span className="text-xs leading-[18px] font-medium text-white">已同步</span>
          </span>
          <span className="flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm leading-5 font-bold text-field-700 shadow-xs">
            完成現場紀錄
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-4 p-4">
        <nav className="flex w-[112px] shrink-0 flex-col gap-2 rounded-md bg-white p-2">
          {TOOLS.map(({ key, label, Icon }) => (
            <div
              key={key}
              className={`flex h-[112px] w-full shrink-0 flex-col items-center justify-center gap-2 rounded-md border px-2 pt-3.5 pb-3 text-center text-sm leading-5 font-bold ${
                key === 'f9'
                  ? 'border-field-600 bg-field-50 text-field-700'
                  : 'border-field-200 bg-field-50 text-field-700'
              }`}
            >
              <Icon className="size-6" />
              <span className="w-16">{label}</span>
            </div>
          ))}
        </nav>

        <section className="flex h-full w-[438px] shrink-0 flex-col overflow-hidden rounded-md bg-white">
          <div className="flex h-16 shrink-0 items-center justify-between px-5">
            <h2 className="text-xl leading-[30px] font-bold text-neutral-900">現場轉錄文字</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1.5 text-xs leading-[18px] font-bold text-neutral-500">
              <span className="size-2 rounded-full bg-neutral-400" />
              {state.transcript.length > 0 ? '錄音結束' : '尚未開始'}
            </span>
          </div>
          <div className="flex h-12 shrink-0 gap-1 px-3 py-1.5">
            <span className="flex h-9 flex-1 items-center justify-center rounded-sm border border-field-200 bg-field-50 text-sm leading-5 font-bold text-field-700">
              原始逐字稿
            </span>
            <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm text-sm leading-5 font-bold text-neutral-500">
              整理摘要
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-5 pt-[18px] pb-6">
            <div className="shrink-0 rounded-sm bg-field-50 px-3 py-2.5">
              <p className="text-xs leading-[18px] font-medium text-field-700">
                逐字稿會隨錄音即時更新，資料已自動儲存。
              </p>
            </div>
            {state.transcript.slice(0, 4).map((s, i) => (
              <div key={i} className="flex shrink-0 flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs leading-[18px]">
                  <span className="font-medium text-neutral-500">{s.t}</span>
                  <span
                    className={`font-bold ${
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
        </section>

        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-white">
          <div className="flex h-[88px] shrink-0 flex-col justify-center gap-1 px-5 py-3.5">
            <h2 className="text-xl leading-[30px] font-bold text-neutral-900">
              「{c.type}」蒐證清單
            </h2>
            <p className="text-xs leading-[18px] font-medium text-neutral-500">
              已完成 {checklistDone}／{checklistTotal}｜現場可新增臨時項目
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-4 pt-1 pb-6">
            {preview.map((item) => (
              <div
                key={item.id}
                className={`flex h-[82px] shrink-0 items-center gap-3 rounded-md border px-3.5 py-3 ${
                  item.done ? 'border-field-200 bg-field-50' : 'border-neutral-200 bg-white'
                }`}
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-sm border ${
                    item.done ? 'border-field-600 bg-field-50' : 'border-neutral-300 bg-white'
                  }`}
                >
                  {item.done && <Check className="size-3.5 text-field-600" />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-sm leading-5 font-bold text-neutral-900">
                    {item.label}
                  </p>
                  <p
                    className={`text-xs leading-[18px] font-medium ${
                      item.done ? 'text-field-700' : 'text-neutral-600'
                    }`}
                  >
                    {item.done ? '已完成' : '尚未完成'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="flex h-20 shrink-0 items-center justify-between border-t border-neutral-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-[7px] rounded-full bg-neutral-100 px-2.5 py-[7px] text-xs leading-[18px] font-bold text-neutral-500">
            <span className="size-2 rounded-full bg-neutral-400" />
            {state.transcript.length > 0 ? '錄音結束' : '尚未錄音'}
          </span>
          <span className="text-sm leading-5 font-bold text-neutral-900">00:00:00</span>
        </div>
        <div className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1">
          {[10, 18, 28, 16, 34, 22, 12, 30, 20, 36, 16, 26, 12, 32, 18, 24, 14, 28, 10, 20, 34, 16, 22, 12].map(
            (h, i) => (
              <span
                key={i}
                className="w-1 rounded-[2px] bg-neutral-300"
                style={{ height: Math.max(6, h / 3) }}
              />
            ),
          )}
        </div>
        <span className="flex h-12 items-center justify-center gap-2 rounded-md border border-field-600 bg-field-600 px-6 text-sm leading-5 font-bold text-white shadow-xs">
          開始錄音
        </span>
      </footer>
    </div>
  )
}
