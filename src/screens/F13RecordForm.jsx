import { useMemo, useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { AiBadge, Button } from '../components/ui.jsx'
import {
  AlignLeft,
  ChevronLeft,
  Clock,
  Cloud,
  Edit,
  FileText,
  Images,
  Lock,
  Pause,
  Play,
  Search,
  Signature,
} from '../components/icons.jsx'

/*
  F13 外勤案件紀錄單 — 正式格式化的稽查紀錄文件（不是草稿）。
  Figma page 10904:2472「F13 外勤開立單據」：
    F13-1   外勤案件紀錄單            (11333:12607) → 本檔主畫面
    F13-1-1 外勤案件紀錄單_完整逐字稿  (11611:14429) → 底部「查看完整逐字稿」開的彈窗（showTranscript）
    展開後                            (12301:8082)  → 同一張 Body 的完整高度版本，
                                                      本檔用可捲動卡片承載，不另做狀態。
    列印單據 ×4                       (11629:16855 等) → A4 版式的列印稿，不是 App 畫面，不實作。

  與 Figma 稿面的刻意差異（稿面是舊版殘留，依 AGENT_BRIEF 修正）：
  - 稿面案件是「0927492927／四維路米克斯貓／台北市大安區」，一律改用 state.activeCase
    （AC-1150811-003｜文化路米克斯犬｜新北市板橋區）。
  - 稿面日期混用 2025/09/01 與民國年，一律民國 115 年。
  - 稿面公文文號「北市動保字…」改為「新北動保字…」。
  - 稿面「附件清單」是寫死的六行，本檔改吃 useApp() 的 attachments（依實際做過什麼動態產生）。
  - 稿面只有「飼養人簽名」一個簽名框，依任務需求併排補上「動檢員簽名」。
  - 稿面照片是 Figma asset URL（7 天過期），一律改成漸層 + inline SVG 自繪。
*/

/* ── 本頁缺的圖示（不動共用的 icons.jsx，避免多個 subagent 互相覆蓋） ── */
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
const Clipboard = (p) => (
  <Svg {...p}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <path d="M9 12h6M9 16h4" />
  </Svg>
)
const Cpu = (p) => (
  <Svg {...p}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
    <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
  </Svg>
)
const Maximize2 = (p) => (
  <Svg {...p}>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </Svg>
)

/* ── 左側工具列（Figma「Field tool rail」，與 F12 同一條，案件紀錄單為目前頁） ── */
const TOOLS = [
  { key: 'summary', label: 'AI摘要', icon: AlignLeft, route: 'f12' },
  { key: 'record', label: '案件紀錄單', icon: Edit, route: null },
  { key: 'improve', label: '限期改善單', icon: Clock, route: 'f14' },
  { key: 'found', label: '拾獲單', icon: FileText, route: 'f15' },
  { key: 'detain', label: '扣留單', icon: Lock, route: 'f16' },
]

/* ── 附件清單的圖示（key 來自 store 的 derived attachments） ── */
const ATTACH_ICON = {
  summary: AlignLeft,
  form: Clipboard,
  record: Clipboard,
  photos: Images,
  transcript: FileText,
  chip: Cpu,
  improvement: Clock,
  found: FileText,
  detain: Lock,
}

/* ── 照片分類標籤的語意色（同 F7 的「標籤」component set） ── */
const TAG_DOT = {
  動物身份: 'bg-tag-identity',
  健康狀況: 'bg-tag-health',
  環境: 'bg-tag-env',
  照護狀態: 'bg-tag-care',
}

/* ── 沒有走完動線就直接跳 f13 時的預設內容 ── */
const FALLBACK_FINDINGS = [
  {
    label: '環境紀錄',
    bullets: ['飼養場所位於一樓騎樓，鐵籠緊靠外牆，遮蔽不足。', '周邊環境有異味，地面可見排泄物與打翻的飲水。'],
  },
  {
    label: '動物狀況',
    bullets: ['體型中等，毛髮局部脫落。', '精神尚可，未見明顯外傷。'],
  },
  {
    label: '飼養方式',
    bullets: ['定量、乾淨的飲食與飲水觀念薄弱。', '未提供犬隻足夠的活動空間與環境清潔。'],
  },
]

const FALLBACK_LAW = [
  '違反《動物保護法》第 5 條第 2 項規定。（飼主對於其管領之動物，應提供安全、乾淨、通風、排水、適當及充足之遮蔽、照明、溫度之生活環境）',
]

const FALLBACK_FOLLOWUP = [
  { label: '後續處理', bullets: ['勸導。飼主承諾將改善，並同意簽收限期改善單。'] },
  {
    label: '改善期限',
    bullets: ['要求立即補充飲水並於 7 日內帶動物就醫，30 日內完成環境改善。', '將於期限屆滿前進行複查，若未改善將依法裁罰。'],
  },
]

const FALLBACK_PHOTOS = [
  { id: 'p1', label: '飼養環境全景', category: '環境照片', tags: [{ label: '陽台鐵籠', group: '環境' }] },
  { id: 'p2', label: '犬隻面部特寫', category: '動物照片', tags: [{ label: '動物身份', group: '動物身份' }] },
  { id: 'p3', label: '飼料與水盆', category: '環境照片', tags: [{ label: '飲水不足', group: '照護狀態' }] },
  { id: 'p4', label: '排泄物堆積情況', category: '環境照片', tags: [{ label: '未定期清理', group: '照護狀態' }] },
  { id: 'p5', label: '居住環境細節', category: '環境照片', tags: [{ label: '通風不良', group: '環境' }] },
  { id: 'p6', label: '犬隻健康狀態', category: '動物照片', tags: [{ label: '精神萎靡', group: '健康狀況' }] },
]

const FALLBACK_TRANSCRIPT = [
  { speaker: '稽查員', text: '您好，請問有人在家嗎？喂？你好！' },
  { speaker: '飼主', text: '你們是誰？要幹嘛？' },
  {
    speaker: '稽查員',
    text: '先生你好，不好意思打擾了。我們是新北市動物保護處的動物保護檢查員，這是我的證件。我們今天來，是想關心一下你飼養的這隻狗的狀況。',
  },
  { speaker: '飼主', text: '喔…好啦，進來看吧。' },
  { speaker: '稽查員', text: '謝謝。請問這邊總共養了幾隻狗？' },
  { speaker: '飼主', text: '就這一隻。' },
  { speaker: '稽查員', text: '我看到環境有點…髒亂，而且味道蠻重的。請問你多久清理一次籠子？', marked: true },
  { speaker: '飼主', text: '呃…我最近比較忙，可能一個禮拜…或更久一點。' },
  { speaker: '稽查員', text: '一個禮拜？先生，籠子應該每天清理才對。而且水盆已經翻倒了，裡面也沒有乾淨的水。' },
  { speaker: '飼主', text: '是喔…我真的比較忙。' },
  { speaker: '稽查員', text: '我注意到牆角和地板上也有很多排泄物，這樣的環境對狗的健康很不好，也會影響到牠們的生活品質。' },
  { speaker: '飼主', text: '我知道啦，我會清。' },
]

/* ── 小元件 ── */

/** 案件資訊卡：label / value 兩欄 */
function InfoCard({ rows, labelWidth = 'w-24', className = '' }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-md border border-neutral-300 bg-white p-4 ${className}`}
    >
      {rows.map((r) => (
        <div key={r.label} className="flex w-full items-start gap-2 text-[13px] leading-normal">
          <p className={`shrink-0 text-ink-sub ${labelWidth}`}>{r.label}</p>
          <p className="min-w-px flex-1 font-medium text-ink">{r.value}</p>
        </div>
      ))}
    </div>
  )
}

/** AI 產出的內容框：可切成 textarea 編輯（Figma 的「Input」框） */
function AiBox({ title, columns, editing, draft, onEdit, onCancel, onSave, onDraft }) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-2">
      {title && (
        <div className="flex w-full items-center gap-2">
          <p className="text-lg leading-7 font-bold text-field-700">{title}</p>
          <AiBadge>AI Assist</AiBadge>
          <span className="h-1 flex-1" />
          {editing ? (
            <span className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={onCancel}>
                取消
              </Button>
              <Button size="sm" onClick={onSave}>
                儲存
              </Button>
            </span>
          ) : (
            <button
              type="button"
              onClick={onEdit}
              className="flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-field-700"
              aria-label={`編輯${title}`}
            >
              <Edit className="size-4" />
            </button>
          )}
        </div>
      )}
      <div
        className={`flex w-full gap-4 rounded-md border bg-white px-4 py-2.5 shadow-xs ${
          editing ? 'border-field-600 ring-1 ring-field-600' : 'border-neutral-200'
        }`}
      >
        {columns.map((col, i) => (
          <div key={col.label} className="flex min-w-px flex-1 flex-col gap-3">
            <p className="text-sm leading-5 font-medium whitespace-nowrap text-field-600">
              {col.label}
            </p>
            {editing ? (
              <textarea
                value={draft[i] ?? ''}
                rows={Math.max(3, col.bullets.length + 1)}
                onChange={(e) => onDraft(i, e.target.value)}
                className="scroll-thin w-full resize-none rounded-sm bg-field-50 px-2 py-1.5 text-xs leading-[18px] text-neutral-700 outline-none"
              />
            ) : (
              <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-[18px] text-ai-700">
                {col.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** 照片示意：漸層底 + inline SVG（不引外部圖片，離線 demo 也要能跑） */
function PhotoArt({ category }) {
  const env = category !== '動物照片'
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: env
            ? 'linear-gradient(150deg,#c9d3d1 0%,#a8b6b3 45%,#7d8c89 100%)'
            : 'linear-gradient(150deg,#d9d3cb 0%,#b6ada2 45%,#8a8177 100%)',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 96 69"
        preserveAspectRatio="xMidYMid slice"
        style={{ filter: 'blur(2px)' }}
      >
        {env ? (
          <>
            <rect x="8" y="4" width="48" height="44" rx="3" fill="#5d6b68" opacity="0.32" />
            <path d="M8 4h48M8 18h48M8 32h48" stroke="#455250" strokeWidth="1.5" opacity="0.35" />
            <path d="M22 4v44M38 4v44" stroke="#455250" strokeWidth="1.5" opacity="0.35" />
            <rect x="0" y="48" width="96" height="21" fill="#6d7a77" opacity="0.45" />
            <ellipse cx="76" cy="52" rx="16" ry="8" fill="#4e5c59" opacity="0.4" />
          </>
        ) : (
          <>
            <rect x="0" y="0" width="96" height="16" fill="#c8c0b6" opacity="0.45" />
            <rect x="0" y="54" width="96" height="15" fill="#5f564d" opacity="0.35" />
            <ellipse cx="46" cy="50" rx="32" ry="15" fill="#6f6459" opacity="0.5" />
            <ellipse cx="64" cy="32" rx="13" ry="12" fill="#7d7165" opacity="0.55" />
            <ellipse cx="22" cy="44" rx="11" ry="9" fill="#7a6f63" opacity="0.4" />
          </>
        )}
      </svg>
    </div>
  )
}

/** 現場照片縮圖：底部 Info Bar（照片 N + 放大），上方掛分類標籤 */
function PhotoThumb({ photo, index }) {
  const tag = (photo.tags ?? []).find((t) => t.x == null && t.y == null) ?? (photo.tags ?? [])[0]
  return (
    <div className="flex w-24 shrink-0 flex-col gap-1.5">
      <p className="truncate text-[13px] leading-normal text-ink-sub" title={photo.label}>
        {photo.label}
      </p>
      <div className="relative h-[69px] w-24 overflow-hidden rounded-sm">
        <PhotoArt category={photo.category} />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/55 px-1.5 py-[3px]">
          <span className="text-xs leading-[18px] font-medium whitespace-nowrap text-white">
            照片 {index + 1}
          </span>
          <span className="h-1 flex-1" />
          <Maximize2 className="size-[11px] text-white" />
        </div>
      </div>
      {tag && (
        <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-neutral-50 px-1.5 py-0.5">
          <span className={`size-1.5 shrink-0 rounded-full ${TAG_DOT[tag.group] ?? 'bg-neutral-400'}`} />
          <span className="truncate text-xs leading-[18px] font-medium text-neutral-700">
            {tag.label}
          </span>
        </span>
      )}
    </div>
  )
}

/** 手寫簽名示意（點一下簽名框才出現） */
function Autograph({ className = '' }) {
  return (
    <svg viewBox="0 0 376 110" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M26 22v72M22 40c16-8 38-6 54-12M30 62c16-4 36-2 52-8M60 30l-4 66" />
        <path d="M112 28c16-6 32 4 25 18-7 15-26 11-21-3M104 76c20-10 46-6 62-16M136 46v42" />
        <path d="M196 24l-4 66M176 44c20-8 42-4 58-12M184 68c20-6 40-2 56-10" />
        <path d="M246 86c38 8 84 6 118-10" />
      </g>
    </svg>
  )
}

/** 簽名框：點一下出現手寫字樣（不做真的手寫板） */
function SignatureBox({ title, signed, onSign }) {
  return (
    <div className="flex min-w-px flex-1 flex-col gap-2">
      <div className="flex h-7 items-end justify-between">
        <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-neutral-900">
          {title}
        </p>
        <Signature className="size-4 text-neutral-500" />
      </div>
      <button
        type="button"
        onClick={onSign}
        className={`flex h-[184px] w-full items-center justify-center rounded-md border bg-white ${
          signed ? 'border-neutral-200' : 'border-dashed border-neutral-300 hover:border-field-400'
        }`}
      >
        {signed ? (
          <Autograph className="h-[110px] w-[376px] max-w-full px-6 text-neutral-900" />
        ) : (
          <span className="text-sm leading-5 font-medium text-neutral-400">點擊此處簽名</span>
        )}
      </button>
    </div>
  )
}

export default function F13RecordForm() {
  const { state, dispatch, attachments } = useApp()
  const c = state.activeCase
  const ai = state.aiSummary

  /* AI 內容：有走過 F12 就吃 aiSummary，沒有就用預設 */
  const initial = useMemo(
    () => ({
      findings:
        ai?.findings?.length > 0
          ? ai.findings.map((f) => ({ ...f }))
          : FALLBACK_FINDINGS.map((f) => ({ ...f })),
      law:
        ai?.law?.length > 0
          ? ai.law.map((f) => ({ ...f }))
          : [{ label: '違反法條', bullets: FALLBACK_LAW }],
      followup:
        ai?.followup?.length > 0
          ? ai.followup.map((f) => ({ ...f }))
          : FALLBACK_FOLLOWUP.map((f) => ({ ...f })),
    }),
    // 只在進頁時彙整一次；之後以使用者編輯結果為準
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [blocks, setBlocks] = useState(initial)
  const [editing, setEditing] = useState(null) // 'findings' | 'law' | 'followup'
  const [draft, setDraft] = useState([])
  const [signed, setSigned] = useState({ keeper: false, officer: false })
  const [showTranscript, setShowTranscript] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [issued, setIssued] = useState(false)

  const startEdit = (key) => {
    setEditing(key)
    setDraft(blocks[key].map((col) => col.bullets.join('\n')))
  }
  const cancel = () => {
    setEditing(null)
    setDraft([])
  }
  const save = (key) => {
    setBlocks((b) => ({
      ...b,
      [key]: b[key].map((col, i) => ({
        ...col,
        bullets: (draft[i] ?? '')
          .split('\n')
          .map((l) => l.replace(/^[・‧·•\-\s]+/, '').trim())
          .filter(Boolean),
      })),
    }))
    cancel()
  }
  const setDraftAt = (i, v) => setDraft((d) => d.map((x, j) => (j === i ? v : x)))

  const photos = state.photos.length > 0 ? state.photos : FALLBACK_PHOTOS
  const transcript = state.transcript.length > 0 ? state.transcript : FALLBACK_TRANSCRIPT

  /*
    附件清單一律吃 useApp() 的 attachments（依實際做過什麼動態產生）。
    兩個處理：
    1) store 的 attachments 固定含一筆「外勤案件紀錄單」，按下確認開立後又會多一筆同名單據 → 去重。
    2) 直接深連結到 f13（沒走過 F3/F7/F12）時 state 是空的，清單只會剩一行；
       此時比照本檔的照片／逐字稿做法補上等同走完動線的預設值，仍保留已開立單據。
  */
  const untouched =
    !state.aiSummary && state.photos.length === 0 && state.transcript.length === 0
  const attachRows = useMemo(() => {
    const list = untouched
      ? [
          { key: 'summary', label: '現場紀錄 AI 摘要' },
          { key: 'form', label: '外勤案件紀錄單' },
          { key: 'photos', label: `案件照片（${FALLBACK_PHOTOS.length} 張）` },
          { key: 'transcript', label: '現場錄音與逐字稿' },
          { key: 'chip', label: '寵物登記查詢結果紀錄' },
          ...state.documents.map((d) => ({ key: d.type, label: d.label })),
        ]
      : attachments
    const seen = new Set()
    return list.filter((a) => {
      if (seen.has(a.label)) return false
      seen.add(a.label)
      return true
    })
  }, [attachments, untouched, state.documents])

  const issue = () => {
    dispatch({
      type: 'ISSUE_DOCUMENT',
      payload: { type: 'record', label: '外勤案件紀錄單' },
    })
    setIssued(true)
  }

  const ownerName = state.ownerId?.name ?? '陳O玲'
  const ownerPhone = state.ownerId?.phone ?? '0923-456-789'

  return (
    <div className="relative flex h-full w-full flex-col bg-canvas">
      {/* ── Top navigation / Field workspace ── */}
      <div className="flex h-[72px] shrink-0 items-center justify-between bg-field-900 pl-5 pr-9">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('f12')}
            className="flex size-12 items-center justify-center rounded-lg border-2 border-field-700 text-white"
            aria-label="返回 AI 摘要"
          >
            <ChevronLeft className="size-6" />
          </button>
          <div className="flex flex-col gap-0.5">
            <p className="text-xl leading-[30px] font-bold text-white">案件紀錄單</p>
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
          <button
            type="button"
            onClick={() => navigate('f1')}
            className="flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-sm leading-5 font-bold text-field-700 shadow-xs"
          >
            完成出勤
          </button>
        </div>
      </div>

      {/* ── Workspace body ── */}
      <div className="flex min-h-0 flex-1 items-start gap-4 p-4">
        {/* 左：工具列 */}
        <div className="flex h-full w-[112px] shrink-0 flex-col gap-2 rounded-md bg-white p-2">
          {TOOLS.map(({ key, label, icon: Icon, route }) => {
            const active = route === null
            return (
              <button
                key={key}
                type="button"
                onClick={() => route && navigate(route)}
                className={`flex h-[112px] w-full shrink-0 flex-col items-center justify-center gap-2 rounded-md border px-2 pt-3.5 pb-3 ${
                  active
                    ? 'border-field-600 bg-field-50 shadow-xs'
                    : 'border-field-200 bg-field-50 hover:border-field-400'
                }`}
              >
                <Icon className="size-6 text-field-700" />
                <span className="text-center text-sm leading-5 font-bold text-field-700">
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        {/* 右：單據本體 */}
        <div className="scroll-thin flex h-full min-w-px flex-1 flex-col gap-3 overflow-y-auto rounded-md bg-white px-6 py-4">
          {/* 案件資訊 */}
          <div className="flex h-10 shrink-0 items-center">
            <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-neutral-900">
              案件資訊
            </p>
          </div>

          <div className="flex w-full shrink-0 items-stretch gap-3">
            <InfoCard
              className="min-w-px flex-1"
              rows={[
                { label: '案件編號', value: c.id },
                { label: '案件名稱', value: c.title },
                { label: '檢舉日期', value: '115/08/11（一）09:24' },
              ]}
            />
            <InfoCard
              className="min-w-px flex-1"
              rows={[
                { label: '小隊長', value: '張組長' },
                { label: '承辦人', value: `${state.user.name} ${state.user.title}` },
                { label: '分案日期', value: '115/08/11（一）' },
                { label: '限辦日期', value: '115/09/10（三）' },
              ]}
            />
            <InfoCard
              className="min-w-px flex-1"
              rows={[
                { label: '飼養人姓名', value: ownerName },
                { label: '電話', value: '02-2960-1234' },
                { label: '手機', value: ownerPhone },
              ]}
            />
          </div>

          <InfoCard
            className="w-full shrink-0"
            labelWidth="w-[140px]"
            rows={[
              { label: '派工案號/公文文號', value: '新北動保字第1150811001號' },
              { label: '行政委託', value: '無' },
              { label: '案址', value: c.address },
              { label: '案由', value: c.description },
            ]}
          />

          <div className="h-px w-full shrink-0 bg-neutral-200" />

          {/* 第一次案件辦理情形 */}
          <div className="flex w-full shrink-0 flex-col gap-1">
            <p className="text-xl leading-[30px] font-bold text-neutral-900">第一次案件辦理情形</p>
            <p className="text-xs leading-[18px] font-medium text-neutral-500">
              稽查日期：115/08/11（一）10:12
            </p>
          </div>

          <AiBox
            title="發現情況"
            columns={blocks.findings}
            editing={editing === 'findings'}
            draft={draft}
            onEdit={() => startEdit('findings')}
            onCancel={cancel}
            onSave={() => save('findings')}
            onDraft={setDraftAt}
          />

          <AiBox
            title="處置方式"
            columns={blocks.law}
            editing={editing === 'law'}
            draft={draft}
            onEdit={() => startEdit('law')}
            onCancel={cancel}
            onSave={() => save('law')}
            onDraft={setDraftAt}
          />

          <AiBox
            columns={blocks.followup}
            editing={editing === 'followup'}
            draft={draft}
            onEdit={() => startEdit('followup')}
            onCancel={cancel}
            onSave={() => save('followup')}
            onDraft={setDraftAt}
          />

          {/* 現場照片 */}
          <div className="flex w-full shrink-0 flex-col gap-2">
            <p className="text-lg leading-7 font-bold text-field-700">現場照片</p>
            <div className="scroll-thin flex w-full items-start gap-6 overflow-x-auto rounded-md border border-neutral-300 bg-white p-2.5">
              {photos.map((p, i) => (
                <PhotoThumb key={p.id} photo={p} index={i} />
              ))}
            </div>
          </div>

          {/* 附件清單 —— 依實際做過什麼動態產生 */}
          <div className="flex w-full shrink-0 flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="text-lg leading-7 font-bold text-field-700">附件清單</p>
              <span className="text-xs leading-[18px] font-medium text-neutral-500">
                共 {attachRows.length} 項，依本次出勤實際產出自動帶入
              </span>
            </div>
            <div className="flex w-full flex-col gap-2.5 p-2.5">
              {attachRows.map((a) => {
                const Icon = ATTACH_ICON[a.key] ?? FileText
                return (
                  <div
                    key={a.key + a.label}
                    className="flex w-full items-center gap-3 rounded-md bg-field-50 px-4 py-3"
                  >
                    <Icon className="size-[22px] shrink-0 text-field-900" />
                    <span className="text-sm leading-5 font-medium text-field-900">{a.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 簽名 */}
          <div className="flex w-full shrink-0 items-start gap-4">
            <SignatureBox
              title="飼養人簽名"
              signed={signed.keeper}
              onSign={() => setSigned((s) => ({ ...s, keeper: true }))}
            />
            <SignatureBox
              title="動檢員簽名"
              signed={signed.officer}
              onSign={() => setSigned((s) => ({ ...s, officer: true }))}
            />
          </div>

          {/* 頁尾動作 */}
          <div className="flex w-full shrink-0 items-center justify-between pt-1 pb-2">
            <span className="text-xs leading-[18px] text-neutral-500">
              {issued
                ? '已開立，單據已歸入本案附件與案件檔案。'
                : '確認開立後單據將歸入本案附件，並同步回案件管理系統。'}
            </span>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => setShowTranscript(true)}>
                預覽正式 PDF
              </Button>
              <Button onClick={issue} disabled={issued}>
                {issued ? '已開立' : '確認開立'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer：錄音紀錄 ── */}
      <div className="flex h-20 shrink-0 items-center gap-5 border-t border-neutral-200 bg-white pr-7 pl-6">
        <p className="w-[68px] shrink-0 text-base leading-6 font-bold text-ink">錄音紀錄</p>
        <span className="h-1 flex-1" />
        <div className="flex w-[432px] shrink-0 items-center gap-5">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            className="flex size-[46px] shrink-0 items-center justify-center rounded-md border border-field-600 bg-field-600 text-white"
            aria-label={playing ? '暫停播放' : '播放錄音'}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <div className="flex h-[46px] min-w-px flex-1 flex-col justify-end gap-[3px]">
            <div className="h-[7px] w-full rounded-[5px] bg-neutral-300">
              <div
                className={`h-full rounded-[5px] bg-field-600 transition-all ${
                  playing ? 'w-1/4' : 'w-0'
                }`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] leading-[18px] text-neutral-900">
              <span>0:00</span>
              <span>2:34</span>
            </div>
          </div>
        </div>
        <span className="h-1 flex-1" />
        <button
          type="button"
          onClick={() => setShowTranscript(true)}
          className="flex h-[46px] shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-sm leading-5 font-medium text-neutral-700"
        >
          查看完整逐字稿
        </button>
      </div>

      {/* ── F13-1-1 完整逐字稿 ── */}
      {showTranscript && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[rgba(15,23,41,0.55)]"
            onClick={() => setShowTranscript(false)}
          />
          <div className="relative flex max-h-[calc(100%-64px)] w-[672px] flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="relative flex shrink-0 flex-col items-center gap-1 px-6 pt-6 pb-3">
              <button
                type="button"
                onClick={() => setShowTranscript(false)}
                className="absolute top-6 left-6 flex size-11 items-center justify-center rounded-lg bg-field-900 text-white"
                aria-label="關閉逐字稿"
              >
                <ChevronLeft className="size-6" />
              </button>
              <p className="text-xl leading-[30px] font-bold text-ink">完整逐字稿</p>
              <p className="text-xs leading-[18px] font-medium text-neutral-500">
                115 年 08 月 11 日 10:12
              </p>
            </div>

            <div className="scroll-thin flex flex-1 flex-col gap-3 overflow-y-auto px-8 py-2">
              {transcript.map((s, i) => (
                <p
                  key={i}
                  className={`text-sm leading-5 ${
                    s.marked ? 'font-bold text-ink' : 'text-neutral-700'
                  }`}
                >
                  {s.speaker}：{s.text}
                </p>
              ))}
            </div>

            <div className="flex shrink-0 flex-col items-center gap-4 px-8 py-5">
              <div className="flex w-full items-center gap-5">
                <button
                  type="button"
                  onClick={() => setPlaying((v) => !v)}
                  className="flex size-[46px] shrink-0 items-center justify-center rounded-md bg-field-600 text-white"
                  aria-label={playing ? '暫停播放' : '播放錄音'}
                >
                  {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                </button>
                <div className="flex min-w-px flex-1 flex-col gap-1">
                  <div className="relative h-[7px] w-full rounded-[5px] bg-neutral-300">
                    <div className="absolute top-1/2 left-[10%] size-3 -translate-y-1/2 rounded-full bg-field-600" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] leading-[18px] text-neutral-900">
                    <span>0:15</span>
                    <span>2:34</span>
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setShowTranscript(false)}>
                <Search className="size-4" />
                搜尋
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
