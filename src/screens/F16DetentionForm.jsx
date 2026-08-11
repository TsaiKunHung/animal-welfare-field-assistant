import { useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { AiBadge, Button, Checkbox, Modal } from '../components/ui.jsx'
import {
  ChevronLeft,
  Cloud,
  AlignLeft,
  Edit,
  Clock,
  FileText,
  Lock,
  Play,
  Pause,
  MapPin,
  Plus,
  Sparkles,
  AlertTriangle,
  Trash,
} from '../components/icons.jsx'

/*
  F16 扣留單 — 依行政執行法即時強制扣留涉案物品／遺體／動物。
  從 F12 摘要頁左側工具列「扣留單」進來。

  Figma page 12466:696「F16 扣留單」的 frame：
    F16 扣留單   (12473:21227) 1194×834 完整頁面（頂欄／工具列／底部錄音列）；表單本體是單欄長版
    扣留單展開   (12476:22214) 1034×1823 表單本體，勾選改成橫排、簽名欄改成兩欄
    Group 2 / 截圖 2025-08-16 → 實體單據掃描圖，設計參考用，不實作

  ▸ 本檔以「扣留單展開」為主（勾選橫排、簽名兩欄、選項清單較新），外框照完整頁面實作。

  ▸ 重點 AI 功能（Figma 稿面沒有，依本專案 demo 需求新增，語彙沿用 <AiBadge> 紫色系）：
    進頁時 AI 先判斷本案（不當飼養、飼主在場、動物存活、現場無毒餌／獸鋏）不符合
    行政執行法第 36 條的即時強制要件 →「AI 判斷此案件不適用扣留單」。
    動檢員仍可堅持開立：按「仍要開立」→ 需在對話框寫明理由 → 表單解鎖，
    頂部橫幅轉成警示樣式並記錄「已忽略 AI 建議」。這是 AI 可否決但不獨斷的示範。

  與 Figma 稿面的刻意差異（稿面是舊版殘留／錯字，依專案設定修正）：
  - 扣留地點稿面寫「臺北市大安區基隆路四段 43 號」→ 改以 state.activeCase.address（新北市板橋區）。
  - 扣留時間稿面「115 年 7 月 19 日 14 時 34分」→ 改為案件當日 115 年 8 月 11 日。
  - 涉案物品稿面第三項寫「金屬製套所陷阱」，是「金屬製套索陷阱」（俗稱山豬吊）的錯字，本檔更正。
  - 法規依據第一條稿面寫「行政罰法第36條第1項」，其餘兩條是行政執行法；三條並列時容易被誤讀成
    同一部法，本檔照稿面保留條號，但把法名分開排版避免黏在一起。
*/

/* ── 左側工具列（與 F12 同一條；本頁把「扣留單」設為 active） ── */
const TOOLS = [
  { key: 'summary', label: 'AI摘要', icon: AlignLeft, route: 'f12' },
  { key: 'record', label: '案件紀錄單', icon: Edit, route: 'f13' },
  { key: 'improve', label: '限期改善單', icon: Clock, route: 'f14' },
  { key: 'found', label: '拾獲單', icon: FileText, route: 'f15' },
  { key: 'detain', label: '扣留單', icon: Lock, route: null },
]

const LAWS = [
  {
    act: '行政罰法第 36 條第 1 項',
    text: '「得沒入或可為證據之物，得扣留之。」',
  },
  {
    act: '行政執行法第 36 條第 1 項',
    text: '「行政機關為阻止犯罪、危害發生或避免急迫危險，而有即時處置之必要時，得為即時強制。」',
  },
  {
    act: '行政執行法第 36 條第 2 項第 2 款',
    text: '「即時強制方法如下：二、對於物之扣留、使用、處置或限制其使用。」',
  },
]

const ITEMS = ['毒餌', '捕獸鋏', '金屬製套索陷阱', '其他']
const BODY_STATES = ['完好', '已有腐敗氣味', '已生蛆蟲']
const CAUSES = ['毒物', '受困獸鋏/山豬吊', '外力致死', '其他']
const CHIP_STATES = ['帶有晶片，號碼：', '動物警戒中，無法掃描。', '經掃描無晶片。']

/* AI 判讀不適用的理由（demo 假資料，實際會由後端規則引擎給） */
const AI_REASONS = [
  '案件類型為「不當飼養」，動物存活且飼主在場配合稽查。',
  '現場蒐證未發現毒餌、捕獸鋏或金屬製套索陷阱等應扣留之涉案物品。',
  '未達行政執行法第 36 條「阻止犯罪、危害發生或避免急迫危險」之即時強制要件。',
]

/* ── 版面小元件（與 F15 同一套：白底、1px 描邊、r-8、pl-14 pr-12 py-12） ── */

function FieldBox({
  prefix,
  value,
  onChange,
  placeholder = '',
  highlight = false,
  disabled = false,
  className = '',
}) {
  return (
    <div
      className={`flex w-full items-center gap-4 rounded-md border bg-white px-3.5 py-3 ${
        highlight ? 'border-[1.5px] border-field-600' : 'border-neutral-200'
      } ${className}`}
    >
      {prefix && (
        <span className="shrink-0 text-sm leading-5 font-medium text-neutral-500">{prefix}</span>
      )}
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="min-w-px flex-1 bg-transparent text-sm leading-5 text-ink outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed"
      />
    </div>
  )
}

function Label({ children, weight = 'bold' }) {
  return (
    <p
      className={`text-base leading-6 text-neutral-900 ${
        weight === 'bold' ? 'font-bold' : 'font-medium'
      }`}
    >
      {children}
    </p>
  )
}

function Divider() {
  return <div className="h-px w-full shrink-0 bg-neutral-200" />
}

/** 簽名欄（Figma「Item 13」：灰色提示字 + edit-2 鉛筆；點一下就簽好，demo 不做手寫板） */
function SignatureBox({ value, hint, onSign, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSign}
      className={`flex w-full items-center gap-2 rounded-md border bg-white px-3.5 py-3 text-left ${
        value ? 'border-field-600' : 'border-neutral-200'
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span
        className={`text-sm leading-5 ${
          value ? 'font-bold text-field-700' : 'text-neutral-400 line-through'
        }`}
      >
        {value || hint}
      </span>
      <Edit className="size-4 shrink-0 text-neutral-500" />
    </button>
  )
}

/** 扣留地點示意圖（Figma「Route Map」950×280）—— 純 CSS + inline SVG，不引外部圖片 */
function LocationMap() {
  return (
    <div className="relative h-[280px] w-full shrink-0 overflow-hidden rounded-lg bg-white">
      <svg
        viewBox="0 0 950 280"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {/* 街廓（底層） */}
        <g fill="#f5f5f5">
          <rect x="0" y="0" width="130" height="130" rx="6" />
          <rect x="158" y="0" width="792" height="130" rx="6" />
          <rect x="0" y="148" width="130" height="132" rx="6" />
          <rect x="158" y="148" width="792" height="132" rx="6" />
        </g>
        {/* 綠地（Figma 是壓在街廓之上的兩顆綠色橢圓） */}
        <ellipse cx="45" cy="30" rx="85" ry="70" fill="#dcf5e4" />
        <ellipse cx="480" cy="260" rx="80" ry="60" fill="#dcf5e4" />
        {/* 現在地 marker */}
        <circle cx="582" cy="169" r="19" fill="#a7d5cf" />
        <circle cx="582" cy="169" r="9" fill="none" stroke="#1f706b" strokeWidth="4" />
        <rect x="556" y="195" width="52" height="24" rx="6" fill="#0e3735" />
        <text x="582" y="211" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff">
          現在地
        </text>
      </svg>
    </div>
  )
}

let animalSeq = 1

export default function F16DetentionForm() {
  const { state, dispatch } = useApp()
  const c = state.activeCase

  /* ── AI 判讀：預設「不適用」，動檢員可覆寫 ── */
  const [override, setOverride] = useState(false)
  const [askOverride, setAskOverride] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const locked = !override

  const [form, setForm] = useState({
    time: '115 年 8 月 11 日 10 時 42 分',
    place: c.address,
    coordinate: '',
    other: '',
    bodyOther: '',
    remark: '',
    partyPhone: '',
    officerPhone: '02-2960-3456',
  })
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const [laws, setLaws] = useState({})
  const [items, setItems] = useState({})
  const [bodyState, setBodyState] = useState('')
  const [bodyOtherOn, setBodyOtherOn] = useState(false)
  const [cause, setCause] = useState('')
  const [animals, setAnimals] = useState([
    { id: 0, kind: '', chipState: CHIP_STATES[0], chip: '' },
  ])
  const [partySign, setPartySign] = useState('')
  const [officerSign, setOfficerSign] = useState('')

  const toggle = (setter) => (key) => setter((m) => ({ ...m, [key]: !m[key] }))
  const setAnimal = (id, patch) =>
    setAnimals((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)))

  const addAnimal = () =>
    setAnimals((list) => [
      ...list,
      { id: animalSeq++, kind: '', chipState: CHIP_STATES[0], chip: '' },
    ])
  const removeAnimal = (id) =>
    setAnimals((list) => (list.length === 1 ? list : list.filter((a) => a.id !== id)))

  const confirmOverride = () => {
    setOverride(true)
    setAskOverride(false)
  }

  const issue = () => {
    if (locked) return
    dispatch({ type: 'ISSUE_DOCUMENT', payload: { type: 'detention', label: '扣留單' } })
    navigate('f13')
  }

  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      {/* ── Top navigation / Field workspace（與 F12 同一條頂欄） ── */}
      <div className="flex h-[72px] shrink-0 items-center justify-between bg-field-900 pr-9 pl-5">
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
            <p className="text-xl leading-[30px] font-bold text-white">扣留單</p>
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

        {/* 右：表單本體 */}
        <div className="flex h-full min-w-px flex-1 flex-col overflow-hidden rounded-md bg-white">
          <div className="scroll-thin flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
            {/* 標題列 */}
            <div className="flex h-10 shrink-0 items-center justify-between">
              <p className="text-xl leading-[30px] font-bold text-neutral-900">填寫扣留單</p>
              <span className="text-xs leading-[18px] text-neutral-500">
                扣留物品需於 24 小時內回報並登錄保管清冊
              </span>
            </div>

            {/* ★ AI 判讀橫幅 —— 本頁的重點 */}
            {locked ? (
              <div className="flex w-full shrink-0 items-start gap-3 rounded-md border border-ai-200 bg-ai-50 px-4 py-3.5">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-ai-700" />
                <div className="flex min-w-px flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-base leading-6 font-bold text-ai-700">
                      AI 判斷此案件不適用扣留單
                    </p>
                    <AiBadge>AI 判讀</AiBadge>
                  </div>
                  <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-[18px] text-ai-700">
                    {AI_REASONS.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2">
                  <Button size="sm" onClick={() => navigate('f14')}>
                    改開限期改善單
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setAskOverride(true)}>
                    仍要開立扣留單
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full shrink-0 items-start gap-3 rounded-md border border-warning bg-warning-bg px-4 py-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
                <div className="flex min-w-px flex-1 flex-col gap-0.5">
                  <p className="text-sm leading-5 font-bold text-warning">
                    已忽略 AI 建議，由動檢員 {state.user.name} 決定開立扣留單
                  </p>
                  <p className="text-xs leading-[18px] text-ink-sub">
                    理由：{overrideReason || '（未填寫）'}　—　本紀錄會隨單據一併送出備查。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOverride(false)
                    setOverrideReason('')
                  }}
                  className="shrink-0 text-xs leading-[18px] font-bold text-field-700 underline"
                >
                  撤回開立
                </button>
              </div>
            )}

            {/* 表單本體：AI 判定不適用時整組壓暗且不可操作 */}
            <fieldset
              disabled={locked}
              className={`flex min-w-px flex-col gap-3 border-0 p-0 ${
                locked ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {/* ① 扣留時間 / 地點 / 門牌座標 / 其他 */}
              <div className="flex w-full shrink-0 flex-col gap-2 rounded-md border border-neutral-300 bg-white p-4">
                <Label>扣留時間：</Label>
                <FieldBox value={form.time} onChange={set('time')} placeholder="民國 年 月 日 時 分" />

                <Label>扣留地點：</Label>
                <FieldBox value={form.place} onChange={set('place')} placeholder="填寫扣留地點" />

                <Label>扣留地點門牌座標：</Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => set('coordinate')('25.0128, 121.4629')}
                    className="flex shrink-0 items-center gap-2 rounded-md border border-neutral-200 bg-white p-3 text-sm leading-5 font-medium text-ink"
                  >
                    <MapPin className="size-6 text-field-700" />
                    取用現在位置
                  </button>
                  {form.coordinate && (
                    <span className="text-sm leading-5 font-medium text-field-700">
                      已帶入座標 {form.coordinate}
                    </span>
                  )}
                </div>
                <LocationMap />

                <Label>其他：</Label>
                <FieldBox
                  value={form.other}
                  onChange={set('other')}
                  placeholder="補充說明扣留地點（例如：騎樓右側鐵籠旁）"
                />
              </div>

              {/* ② 法規依據 / 涉案物品 / 遺體 / 疑似死因 / 動物 */}
              <div className="flex w-full shrink-0 flex-col gap-2.5 rounded-md border border-neutral-300 bg-white p-4">
                <Label>法規依據</Label>
                <div className="flex flex-col gap-2 px-4">
                  {LAWS.map((l) => (
                    <Checkbox
                      key={l.act}
                      checked={!!laws[l.act]}
                      onChange={() => toggle(setLaws)(l.act)}
                      className="items-start"
                      label={
                        <span>
                          <span className="font-bold">{l.act}</span>規定：{l.text}
                        </span>
                      }
                    />
                  ))}
                </div>

                <Divider />
                <p className="text-base leading-6 text-black">
                  為調查涉嫌違反動物保護法案件，本處依前項規定扣留下列物品：
                </p>

                <Label>涉案物品</Label>
                <div className="flex flex-wrap items-start gap-x-5 gap-y-2 px-4">
                  {ITEMS.map((i) => (
                    <Checkbox
                      key={i}
                      label={i}
                      checked={!!items[i]}
                      onChange={() => toggle(setItems)(i)}
                      className="shrink-0 whitespace-nowrap"
                    />
                  ))}
                </div>

                <Label>遺體</Label>
                <Label weight="medium">遺體狀態</Label>
                <div className="flex flex-col gap-2 px-4">
                  <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
                    {BODY_STATES.map((b) => (
                      <Checkbox
                        key={b}
                        label={b}
                        checked={bodyState === b}
                        onChange={() => setBodyState(bodyState === b ? '' : b)}
                        className="shrink-0 whitespace-nowrap"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      label="其他"
                      checked={bodyOtherOn}
                      onChange={() => setBodyOtherOn((v) => !v)}
                      className="w-[60px] shrink-0"
                    />
                    <FieldBox
                      value={form.bodyOther}
                      onChange={set('bodyOther')}
                      placeholder="遭車輾過痕跡"
                      highlight={bodyOtherOn}
                    />
                  </div>
                </div>

                <Label weight="medium">疑似死因</Label>
                <div className="flex flex-wrap items-start gap-x-5 gap-y-2 px-4">
                  {CAUSES.map((x) => (
                    <Checkbox
                      key={x}
                      label={x}
                      checked={cause === x}
                      onChange={() => setCause(cause === x ? '' : x)}
                      className="shrink-0 whitespace-nowrap"
                    />
                  ))}
                </div>

                <Label>動物</Label>
                {animals.map((a, idx) => (
                  <div key={a.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <FieldBox
                        value={a.kind}
                        onChange={(v) => setAnimal(a.id, { kind: v })}
                        placeholder="犬 1 隻、貓 4 隻、蛇......"
                      />
                      {animals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAnimal(a.id)}
                          className="flex size-11 shrink-0 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:text-danger"
                          aria-label={`移除第 ${idx + 1} 種動物`}
                        >
                          <Trash className="size-5" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 px-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          label={CHIP_STATES[0]}
                          checked={a.chipState === CHIP_STATES[0]}
                          onChange={() => setAnimal(a.id, { chipState: CHIP_STATES[0] })}
                          className="w-[136px] shrink-0 whitespace-nowrap"
                        />
                        <FieldBox
                          value={a.chip}
                          onChange={(v) => setAnimal(a.id, { chip: v })}
                          placeholder="900115000530794"
                          highlight={a.chipState === CHIP_STATES[0]}
                        />
                      </div>
                      {CHIP_STATES.slice(1).map((s) => (
                        <Checkbox
                          key={s}
                          label={s}
                          checked={a.chipState === s}
                          onChange={() => setAnimal(a.id, { chipState: s })}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex items-start">
                  <button
                    type="button"
                    onClick={addAnimal}
                    className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white p-3 text-sm leading-5 font-medium text-ink"
                  >
                    <Plus className="size-6 text-field-700" />
                    新增一種動物
                  </button>
                </div>
              </div>

              {/* ③ 備註 / 簽名 */}
              <div className="flex w-full shrink-0 flex-col gap-2.5 rounded-md border border-neutral-300 bg-white p-4">
                <Label>備註欄：</Label>
                <textarea
                  value={form.remark}
                  onChange={(e) => set('remark')(e.target.value)}
                  rows={3}
                  placeholder="描述備註"
                  className="scroll-thin w-full resize-none rounded-md border border-neutral-200 bg-white px-3.5 py-3 text-sm leading-5 text-ink outline-none placeholder:text-neutral-400"
                />

                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <Label>當事人簽名：</Label>
                  <Label>當事人聯絡電話：</Label>
                  <SignatureBox
                    value={partySign}
                    hint="受訪人姓名(點擊簽名)"
                    onSign={() => setPartySign(state.ownerId?.name ?? '陳O玲')}
                  />
                  <FieldBox
                    value={form.partyPhone}
                    onChange={set('partyPhone')}
                    placeholder="0900-000-000"
                  />

                  <Label>動保員簽名：</Label>
                  <Label>動保員聯絡電話：</Label>
                  <SignatureBox
                    value={officerSign}
                    hint="動保員姓名(點擊簽名)"
                    onSign={() => setOfficerSign(state.user.name)}
                  />
                  <FieldBox value={form.officerPhone} onChange={set('officerPhone')} />
                </div>
              </div>
            </fieldset>
          </div>

          {/* 頁尾主要動作 */}
          <div className="flex shrink-0 items-center justify-between border-t border-hairline px-5 py-3">
            <span className="text-xs leading-[18px] text-neutral-500">
              {locked
                ? 'AI 判斷不適用，表單已鎖定；確認要開立請按上方「仍要開立扣留單」。'
                : '開立後扣留單會附到案件紀錄單，並同步保管清冊。'}
            </span>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => navigate('f12')}>
                返回摘要
              </Button>
              <Button onClick={issue} disabled={locked}>
                確認開立
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RecordingBar />

      {/* ── 覆寫 AI 判讀的確認對話框 ── */}
      <Modal
        open={askOverride}
        onClose={() => setAskOverride(false)}
        title="AI 判斷不適用，仍要開立扣留單？"
        width={640}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAskOverride(false)}>
              取消
            </Button>
            <Button onClick={confirmOverride} disabled={overrideReason.trim().length < 2}>
              仍要開立
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 px-6 py-5">
          <div className="flex items-start gap-2 rounded-md border border-warning bg-warning-bg px-3.5 py-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
            <p className="text-sm leading-5 text-ink-sub">
              扣留屬即時強制處分，開立後將限制當事人之財產權。若 AI 判讀與現場情況不符，
              請寫明理由後開立；理由會併入案件紀錄供上級複核。
            </p>
          </div>
          <p className="text-sm leading-5 font-medium text-neutral-700">仍要開立的理由</p>
          <textarea
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            rows={4}
            placeholder="例如：現場另在後院發現金屬製套索陷阱 2 具，需即時扣留保全證據。"
            className="scroll-thin w-full resize-none rounded-md border border-neutral-300 bg-white px-3.5 py-2.5 text-sm leading-5 text-ink outline-none placeholder:text-neutral-400 focus:border-field-600"
          />
        </div>
      </Modal>
    </div>
  )
}

/* ── 底部錄音紀錄列（Figma Footer 12473:21398，與 F15 同一套） ── */
function RecordingBar() {
  const [playing, setPlaying] = useState(false)
  const Icon = playing ? Pause : Play

  return (
    <footer className="flex h-20 shrink-0 items-center border-t border-neutral-200 bg-white pr-[27px] pl-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-base leading-6 font-bold text-ink">錄音紀錄</p>

        <div className="flex w-[432px] items-center gap-5">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            className="flex size-[46px] shrink-0 items-center justify-center rounded-md border border-field-600 bg-field-600 text-white"
            aria-label={playing ? '暫停播放' : '播放錄音'}
          >
            <Icon className="size-4" />
          </button>
          <div className="flex h-[46px] min-w-px flex-1 flex-col justify-end gap-[3px]">
            <div className="h-[7px] w-full overflow-hidden rounded-[5px] bg-neutral-200">
              <div
                className="h-full rounded-[5px] bg-field-600 transition-[width]"
                style={{ width: playing ? '38%' : '0%' }}
              />
            </div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] leading-[18px] text-neutral-900">
                {playing ? '0:58' : '0:00'}
              </span>
              <span className="text-[10px] leading-[18px] text-neutral-900">2:34</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('f3')}
          className="flex h-[46px] shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm leading-5 font-medium text-neutral-700"
        >
          查看完整逐字稿
        </button>
      </div>
    </footer>
  )
}
