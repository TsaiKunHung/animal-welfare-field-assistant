import { useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { AiBadge, Button, Checkbox } from '../components/ui.jsx'
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
} from '../components/icons.jsx'

/*
  F15 拾獲單 — 動物拾獲切結書。從 F12 摘要頁左側工具列「拾獲單」進來。

  Figma page 12466:681「F15 拾獲單」有兩個 frame：
    F15 拾獲單   (12468:7467) 1194×834 完整頁面（頂欄／工具列／底部錄音列），表單本體是**單欄長版**
    拾獲單展開   (12472:12012) 1034×1542 只有表單本體，欄位排成**兩欄**

  ▸ 版型採用「拾獲單展開」的兩欄版，理由：
    1. 它是後期版本 —— 單欄版把 468px 的欄位拉成 950px 全寬，iPad 橫向看起來一行只填三個字，非常浪費；
       兩欄版把「動物種類／動物數量」「品種／年齡」「毛色／特徵」「身分證字號／出生年月日」「住址／電話」
       成對排好，捲動距離少一半（1542 vs 2168），demo 時捲不完的痛點會小很多。
    2. 兩欄版的勾選也改成橫排（疫苗、習性各排成一列），跟 F16 扣留單展開版一致；
       單欄版是每個勾選各佔一行的舊寫法。
    3. 兩欄版的欄位內容較新（健康情形只留「良好／其他」、疫苗選項已清乾淨）。
    外框（頂欄／左側工具列／底部錄音紀錄列）仍照完整頁面 12468:7467 實作。

  與 Figma 稿面的刻意差異（稿面是舊版殘留，依專案設定修正）：
  - 拾獲地點稿面寫「臺北市大安區基隆路四段 43 號」→ 一律以 state.activeCase.address 為準（新北市板橋區）。
  - 拾獲日期稿面寫「115 年 7 月 19 日」→ 改用案件通報日 115 年 8 月 11 日。
  - 「本年施打疫苗種類」的第二個選項稿面寫「保持安全、舒適、通風且適當的飼養密度」，
    那是限期改善單的改善事項被貼錯過來，不是疫苗；本檔移除，只留 無／七合一或八合一／貓三合一或五合一／狂犬病。
  - 涉及晶片號碼、切結人資料的欄位優先吃 state.petRecord / state.ownerId（F5、F6 查過就會自動帶入）。
*/

/* ── 左側工具列（Figma「Field tool rail」，與 F12 同一條；本頁把「拾獲單」設為 active） ── */
const TOOLS = [
  { key: 'summary', label: 'AI摘要', icon: AlignLeft, route: 'f12' },
  { key: 'record', label: '案件紀錄單', icon: Edit, route: 'f13' },
  { key: 'improve', label: '限期改善單', icon: Clock, route: 'f14' },
  { key: 'found', label: '拾獲單', icon: FileText, route: null },
  { key: 'detain', label: '扣留單', icon: Lock, route: 'f16' },
]

const VACCINES = ['無', '七合一／八合一', '貓三合一／五合一', '狂犬病']
const HEALTH = ['良好', '其他']
const HABITS = ['追車', '吼叫', '亂咬東西/人', '膽小', '搶食', '具攻擊性']
const ID_DOCS = ['身分證', '駕照', '居留證']

const DECLARATION =
  '本人已確認非該動物之飼主，同意貴處代為後續收容處理該動物，不得提出任何異議或要求任何權利，' +
  '並了解送交之動物經公告後若無人認領，或發現送交動物患有法定傳染病、重病無法治癒、嚴重影響環境衛生、' +
  '人畜健康、公共安全或其他緊急狀況，得依動物保護法相關規定處理。'

/* ── 版面小元件（Figma「Item 8 / Frame 68」：白底、1px 描邊、r-8、pl-14 pr-12 py-12） ── */

/** 表單輸入框。prefix 是框內的灰色欄位名（Figma 就是這樣做的，不是外掛 label） */
function FieldBox({ prefix, value, onChange, placeholder = '', highlight = false, className = '' }) {
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
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="min-w-px flex-1 bg-transparent text-sm leading-5 text-ink outline-none placeholder:text-neutral-400"
      />
    </div>
  )
}

/** 區塊標題（Figma Text md/Semibold 16/24 bold neutral-900） */
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

/** 勾選群組上方的小標（Figma Text sm/Medium 14/20 #535862） */
function SubLabel({ children }) {
  return <p className="text-sm leading-5 font-medium text-ink-sub">{children}</p>
}

/** 一整排 checkbox（Figma 兩欄版就是橫排 + gap 20） */
function CheckRow({ options, values, onToggle, className = '' }) {
  return (
    <div className={`flex flex-wrap items-start gap-x-5 gap-y-2 px-4 ${className}`}>
      {options.map((o) => (
        <Checkbox key={o} label={o} checked={!!values[o]} onChange={() => onToggle(o)} />
      ))}
    </div>
  )
}

function Divider() {
  return <div className="h-px w-full shrink-0 bg-neutral-200" />
}

export default function F15FoundForm() {
  const { state, dispatch } = useApp()
  const c = state.activeCase
  const pet = state.petRecord
  const owner = state.ownerId

  /* 案件資料先帶入，動檢員仍可改（Figma 的欄位預設值已是「填過一半」的狀態） */
  const [form, setForm] = useState({
    place: c.address,
    date: '115 年 8 月 11 日',
    species: c.animal.species,
    count: String(c.animal.count),
    breed: c.animal.breed,
    age: '',
    color: '',
    feature: '',
    chip: pet?.chip ?? '',
    habitOther: '',
    declarantName: owner?.name ?? '陳O玲',
    declarantId: owner?.idNumber ?? 'A******890',
    declarantBirth: owner?.birth ?? '',
    declarantAddress: owner?.address ?? '',
    declarantPhone: owner?.phone ?? '',
    receiverName: `${state.user.name}（${state.user.title}）`,
    issuedAt: '115 年 8 月 11 日',
  })
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  /* 勾選狀態 —— 單選型（性別／絕育／健康情形）用字串，多選型用 map */
  const [gender, setGender] = useState(c.animal.gender === '母' ? '母' : '公')
  const [neutered, setNeutered] = useState('不詳')
  const [health, setHealth] = useState('良好')
  const [vaccines, setVaccines] = useState({ 無: true })
  const [habits, setHabits] = useState({})
  const [habitOtherOn, setHabitOtherOn] = useState(false)
  const [declared, setDeclared] = useState(false)
  const [idDocs, setIdDocs] = useState({ 身分證: true })

  const toggle = (setter) => (key) => setter((m) => ({ ...m, [key]: !m[key] }))

  const [issued, setIssued] = useState(false)
  const issue = () => {
    if (issued) return
    setIssued(true)
    dispatch({ type: 'ISSUE_DOCUMENT', payload: { type: 'found', label: '拾獲單' } })
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
            <p className="text-xl leading-[30px] font-bold text-white">拾獲單</p>
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
              <div className="flex items-center gap-2">
                <p className="text-xl leading-[30px] font-bold text-neutral-900">填寫拾獲單</p>
                <AiBadge>AI 已預填</AiBadge>
              </div>
              <span className="text-xs leading-[18px] text-neutral-500">
                灰字為 AI 由案件與查詢結果帶入，可直接修改
              </span>
            </div>

            {/* ① 拾獲地點 / 拾獲日期 */}
            <div className="flex w-full shrink-0 flex-col gap-2 rounded-md border border-neutral-300 bg-white p-4">
              <Label>拾獲地點：</Label>
              <FieldBox value={form.place} onChange={set('place')} placeholder="填寫拾獲地點" />
              <Label>拾獲日期：</Label>
              <FieldBox value={form.date} onChange={set('date')} placeholder="民國 年 月 日" />
            </div>

            {/* ② 動物資料 */}
            <div className="flex w-full shrink-0 flex-col gap-4 rounded-md border border-neutral-300 bg-white p-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <Label>動物種類</Label>
                <Label>動物數量</Label>
                <FieldBox
                  value={form.species}
                  onChange={set('species')}
                  placeholder="犬、貓、蛇......"
                />
                <FieldBox prefix="數量：" value={form.count} onChange={set('count')} />
              </div>

              <div className="flex flex-col gap-2.5">
                <Label>動物資料</Label>
                <div className="grid grid-cols-2 gap-4">
                  <FieldBox prefix="品種：" value={form.breed} onChange={set('breed')} />
                  <FieldBox prefix="年齡：" value={form.age} onChange={set('age')} />
                  <FieldBox prefix="毛色：" value={form.color} onChange={set('color')} />
                  <FieldBox prefix="特徵：" value={form.feature} onChange={set('feature')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <Label>動物性別</Label>
                <Label>絕育</Label>
                <div className="flex items-start gap-x-6 px-4">
                  {['公', '母'].map((g) => (
                    <Checkbox
                      key={g}
                      label={g}
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      className="shrink-0 whitespace-nowrap"
                    />
                  ))}
                </div>
                <div className="flex items-start gap-x-6 px-4">
                  {['有', '無', '不詳'].map((n) => (
                    <Checkbox
                      key={n}
                      label={n}
                      checked={neutered === n}
                      onChange={() => setNeutered(n)}
                      className="shrink-0 whitespace-nowrap"
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <Label>晶片號碼</Label>
                <FieldBox
                  value={form.chip}
                  onChange={set('chip')}
                  placeholder={pet ? '' : '尚未掃描到晶片，可手動輸入'}
                  highlight={!!pet}
                />
              </div>

              <div className="flex flex-col gap-3">
                <SubLabel>本年施打疫苗種類：</SubLabel>
                <CheckRow options={VACCINES} values={vaccines} onToggle={toggle(setVaccines)} />

                <SubLabel>健康情形：</SubLabel>
                <div className="flex items-start gap-5 px-4">
                  {HEALTH.map((h) => (
                    <Checkbox
                      key={h}
                      label={h}
                      checked={health === h}
                      onChange={() => setHealth(h)}
                    />
                  ))}
                </div>

                <SubLabel>習性：</SubLabel>
                <div className="flex flex-col gap-4 px-4">
                  <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
                    {HABITS.map((h) => (
                      <Checkbox
                        key={h}
                        label={h}
                        checked={!!habits[h]}
                        onChange={() => toggle(setHabits)(h)}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      label="其他"
                      checked={habitOtherOn}
                      onChange={() => setHabitOtherOn((v) => !v)}
                      className="w-[60px] shrink-0"
                    />
                    <FieldBox
                      value={form.habitOther}
                      onChange={set('habitOther')}
                      placeholder="描述情形"
                      highlight={habitOtherOn}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ③ 聲明 / 切結人 / 接收人 */}
            <div className="flex w-full shrink-0 flex-col gap-4 py-1">
              <Divider />

              <div className="flex w-full items-start gap-4 rounded-md border border-neutral-200 bg-white px-3.5 py-3">
                <Label>聲明內容：</Label>
                <div className="min-w-px flex-1">
                  <Checkbox
                    checked={declared}
                    onChange={() => setDeclared((v) => !v)}
                    className="items-start"
                    label={DECLARATION}
                  />
                </div>
              </div>

              <Label>切結人</Label>
              <FieldBox
                prefix="姓名："
                value={form.declarantName}
                onChange={set('declarantName')}
              />
              <div className="grid grid-cols-2 gap-4">
                <FieldBox
                  prefix="身分證字號："
                  value={form.declarantId}
                  onChange={set('declarantId')}
                />
                <FieldBox
                  prefix="出生年月日："
                  value={form.declarantBirth}
                  onChange={set('declarantBirth')}
                  placeholder="年/月/日"
                  highlight={!form.declarantBirth}
                />
                <FieldBox
                  prefix="住址："
                  value={form.declarantAddress}
                  onChange={set('declarantAddress')}
                />
                <FieldBox
                  prefix="電話："
                  value={form.declarantPhone}
                  onChange={set('declarantPhone')}
                />
              </div>

              <Label>接收人</Label>
              <div className="flex w-full items-center gap-3 rounded-md border border-neutral-200 bg-white px-3.5 py-3">
                <span className="shrink-0 text-sm leading-5 font-medium text-neutral-500">
                  核對身分證明文件：
                </span>
                <div className="flex items-start gap-2">
                  {ID_DOCS.map((d) => (
                    <Checkbox
                      key={d}
                      label={d}
                      checked={!!idDocs[d]}
                      onChange={() => toggle(setIdDocs)(d)}
                    />
                  ))}
                </div>
              </div>
              <FieldBox prefix="姓名：" value={form.receiverName} onChange={set('receiverName')} />

              <Divider />

              <FieldBox
                prefix="日期："
                value={form.issuedAt}
                onChange={set('issuedAt')}
                placeholder="年/月/日"
              />
            </div>
          </div>

          {/* 頁尾主要動作 */}
          <div className="flex shrink-0 items-center justify-between border-t border-hairline px-5 py-3">
            <span className="text-xs leading-[18px] text-neutral-500">
              {declared
                ? '聲明內容已由切結人確認，開立後會附到案件紀錄單。'
                : '請先確認切結人已閱讀聲明內容再開立。'}
            </span>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => navigate('f12')}>
                返回摘要
              </Button>
              <Button onClick={issue}>確認開立</Button>
            </div>
          </div>
        </div>
      </div>

      <RecordingBar />
    </div>
  )
}

/* ── 底部錄音紀錄列（Figma Footer 12468:7587：錄音紀錄 + 播放鈕 + 進度條 + 查看完整逐字稿） ── */
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
