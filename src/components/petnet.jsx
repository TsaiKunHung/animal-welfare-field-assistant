import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Copy,
  EyeOff,
  Search,
  User,
} from './icons.jsx'

/*
  模擬「寵物登記管理資訊網」(pet.gov.tw) —— F6 內嵌瀏覽器的內容
  Figma page「F6 寵物資訊查詢 NEW 0720 ★AI」(12486:5253) 九個 frame。

  ⚠️ 為什麼要做這一整個假網站：
     農業部沒有開放系統介接（見稿面右側 image 22 的會議摘要），開發團隊無法在
     底層串接官方寵物登記資料庫。設計上的解法是「在外勤小助手內嵌一個瀏覽器」，
     動檢員直接在裡面操作寵登網，再用「複製資料回外勤小助手」把結果帶回本地。
     所以 F6 的查詢不能再是本地假資料庫，必須把這條真實動線演出來。

  ⚠️ Figma 裡的寵登網畫面全部是「貼上去的截圖」(image fill + 捲軸)，沒有任何互動、
     沒有畫「帶入」與「帶回」。本檔把截圖重建成可點的畫面，並補上這兩段：
       ・帶入：頂部「外勤小助手帶入」面板（一鍵填入）＋進到進階查詢時自動預填
       ・帶回：底部「複製資料回外勤小助手」

  ⚠️ 一律不引外部圖片（離線 demo 也要能跑），官網的照片以漸層色塊替代。

  流程（對照 Figma frame 順序）：
    home     前台首頁                          12486:5516
    home+    「工作人員入口」下拉               12494:8401
    login    登入後台（帳號／密碼／圖形驗證碼） 12494:8646
    otp      Email 二次驗證                     12494:19184
    console  後台首頁（最新消息）               12494:19435
    console+ 「資料查詢」下拉                   12494:19681
    advanced 進階資料查詢                       12494:19928
    results  查詢結果＋複製資料回外勤小助手     12542:1030
*/

/* 飼主 —— 後台查詢是動檢員以公務帳號登入後的授權查詢，顯示明碼（Figma frame 9 寫「陳筱玲」）。
   對外／摘要類畫面仍沿用匿名格式（陳O玲 / A******890），見 F12。 */
export const OWNER = { name: '陳筱玲', idNumber: 'A123456789' }

/* 在養寵物清單 —— 欄位依參考頁「寵登網offline 資料欄位及建議匿名格式」(10731:3098)。
   後台查詢結果表格顯示前 8 欄，其餘一併寫進 state.petRecord 供 F13／F15 引用。 */
export const PETS = [
  {
    chip: '900115000530794',
    name: 'Burder',
    gender: '公',
    neutered: '已絕育',
    vaccine: '未施打',
    species: '犬 / 米克斯',
    registeredAt: '2024/07/08',
    station: '大利動物醫院',
    stationPhone: '02-2960-1234',
    injectedAt: '—',
    motherChip: '—',
    otherChip: '—',
  },
  {
    chip: '900115000530795',
    name: 'Mimi',
    gender: '母',
    neutered: '已絕育',
    vaccine: '已施打',
    species: '犬 / 米克斯',
    registeredAt: '2023/03/15',
    station: '大利動物醫院',
    stationPhone: '02-2960-1234',
    injectedAt: '2025/05/07',
    motherChip: '—',
    otherChip: '—',
  },
  {
    chip: '900115000530796',
    name: 'Lucky',
    gender: '公',
    neutered: '已絕育',
    vaccine: '未施打',
    species: '犬 / 柴犬',
    registeredAt: '2022/11/02',
    station: '板橋動物之家',
    stationPhone: '02-2959-6353',
    injectedAt: '—',
    motherChip: '—',
    otherChip: '—',
  },
]

/* 示範用固定值：圖形驗證碼與 Email 驗證碼都可一鍵填入，demo 不會卡在打字 */
const CAPTCHA = '546431'
const OTP_CODE = '815204'
const STAFF_ACCOUNT = 'NTPCAPO1'
const STAFF_EMAIL = 'ntpc.apo****@gmail.com'

/* ─────────────────────── 對外元件 ─────────────────────── */

/**
 * 內嵌的寵登網。
 * @param prefill    {chip, ownerName, ownerId} 外勤小助手已取得、可一鍵帶入查詢表單的資料
 * @param onCopyBack (pet) => void 按下「複製資料回外勤小助手」時回傳選中的寵物
 */
export default function PetNet({ prefill, onCopyBack }) {
  const [step, setStep] = useState('home')
  const [staffMenu, setStaffMenu] = useState(false)
  const [queryMenu, setQueryMenu] = useState(false)

  /* 登入用欄位：帳密預填（動檢員的公務帳號已記在裝置上），驗證碼要自己填 */
  const [account, setAccount] = useState(STAFF_ACCOUNT)
  const [password, setPassword] = useState('••••••••••')
  const [captcha, setCaptcha] = useState('')
  const [otp, setOtp] = useState('')

  /* 進階資料查詢的四個欄位 */
  const [form, setForm] = useState({ ownerId: '', ownerName: '', chip: '', rabies: '' })
  const [autoFilled, setAutoFilled] = useState(false)
  const [picked, setPicked] = useState(0)

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  /* 進到「進階資料查詢」時自動預填晶片號碼 —— 「帶入」的第一段 */
  useEffect(() => {
    if (step !== 'advanced' || autoFilled) return
    if (!prefill?.chip) return
    setForm((f) => ({ ...f, chip: prefill.chip }))
    setAutoFilled(true)
  }, [step, autoFilled, prefill])

  useEffect(() => {
    if (step !== 'searching') return
    const id = setTimeout(() => setStep('results'), 1400)
    return () => clearTimeout(id)
  }, [step])

  /* 用晶片號碼查 → 只會有那一隻；用飼主證件／姓名查 → 名下全部 */
  const rows = form.chip.trim()
    ? PETS.filter((p) => p.chip === form.chip.trim())
    : PETS

  /* 底部提示：依現在走到哪一段換句話，讓動檢員知道下一步 */
  const footerHint =
    step === 'console'
      ? '請從上方「資料查詢 → 進階資料查詢」開始查詢'
      : ['advanced', 'searching', 'results'].includes(step)
        ? '查詢完成後，此處會出現「複製資料回外勤小助手」'
        : '請先以公務帳號登入寵物登記管理資訊網後台'

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <BringInPanel
        prefill={prefill}
        enabled={step === 'advanced'}
        hint={
          step === 'advanced'
            ? '點「填入」直接寫進寵登網的查詢欄位，不必手動輸入'
            : ['searching', 'results'].includes(step)
              ? '查詢條件已帶入寵登網，結果請看下方'
              : '進到「資料查詢 → 進階資料查詢」後即可一鍵填入'
        }
        onFill={(k, v) => setField(k, v)}
        filled={form}
      />

      {/* 瀏覽器視窗（Figma：1041×495 的捲動區）
          ⚠️ 捲動層與登入彈窗要分開：彈窗若放在捲動層裡，一捲動就會跟著跑掉 */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-sm border border-neutral-300 bg-white">
        <div className="scroll-thin absolute inset-0 overflow-y-auto">
          {['home', 'login', 'otp'].includes(step) ? (
            <FrontSite
              staffMenu={staffMenu}
              onToggleStaffMenu={() => setStaffMenu((v) => !v)}
              onEnterConsole={() => {
                setStaffMenu(false)
                setStep('login')
              }}
              dimmed={step !== 'home'}
            />
          ) : (
            <ConsoleSite
              step={step}
              queryMenu={queryMenu}
              onToggleQueryMenu={() => setQueryMenu((v) => !v)}
              onAdvanced={() => {
                setQueryMenu(false)
                setStep('advanced')
              }}
              form={form}
              setField={setField}
              autoFilled={autoFilled}
              rows={rows}
              picked={picked}
              setPicked={setPicked}
              onSearch={() => {
                setPicked(0) // 換條件重查，之前選到第幾筆要歸零（否則 rows[picked] 可能超出範圍）
                setStep('searching')
              }}
              onBackToForm={() => setStep('advanced')}
            />
          )}
        </div>

        {step === 'login' && (
          <LoginDialog
            account={account}
            setAccount={setAccount}
            password={password}
            setPassword={setPassword}
            captcha={captcha}
            setCaptcha={setCaptcha}
            onSubmit={() => setStep('otp')}
          />
        )}
        {step === 'otp' && (
          <OtpDialog otp={otp} setOtp={setOtp} onSubmit={() => setStep('console')} />
        )}
      </div>

      {/* 底部：把結果帶回本地（Figma 12542:1030 的 Frame 82） */}
      <div className="flex h-10 shrink-0 items-center justify-center">
        {step === 'results' ? (
          <button
            onClick={() => onCopyBack?.(rows[picked])}
            className="flex h-10 w-[264px] items-center justify-center gap-2 rounded-md bg-field-600 text-sm leading-5 font-bold text-white shadow-xs hover:bg-field-700"
          >
            <Copy className="size-[18px]" />
            複製資料回外勤小助手
          </button>
        ) : (
          <p className="text-xs leading-[18px] font-medium text-neutral-500">{footerHint}</p>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────── 帶入面板（外勤小助手的 UI，不是寵登網的） ─────────────────────── */

function BringInPanel({ prefill, enabled, hint, onFill, filled }) {
  const items = [
    { key: 'chip', label: '寵物晶片號碼', value: prefill?.chip },
    { key: 'ownerId', label: '飼主證件號碼', value: prefill?.ownerId },
    { key: 'ownerName', label: '飼主姓名', value: prefill?.ownerName },
  ].filter((i) => i.value)

  if (items.length === 0) return null

  return (
    <div className="flex shrink-0 flex-col gap-2 rounded-md border border-field-200 bg-field-50 px-3.5 py-2.5">
      <div className="flex items-center gap-2">
        <p className="text-sm leading-5 font-bold text-field-700">本案已取得的資料</p>
        <p className="text-xs leading-[18px] font-medium text-field-600">{hint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((i) => {
          const done = filled[i.key] === i.value
          return (
            <span
              key={i.key}
              className="flex items-center gap-2 rounded-full bg-white py-1 pr-1 pl-3 shadow-xs"
            >
              <span className="text-xs leading-[18px] font-medium text-neutral-500">
                {i.label}
              </span>
              <span className="text-sm leading-5 font-bold text-neutral-900">{i.value}</span>
              <button
                onClick={() => onFill(i.key, i.value)}
                disabled={!enabled || done}
                className={`rounded-full px-2.5 py-0.5 text-xs leading-[18px] font-bold ${
                  done
                    ? 'bg-field-100 text-field-700'
                    : 'bg-field-600 text-white disabled:bg-neutral-200 disabled:text-neutral-500'
                }`}
              >
                {done ? '已填入' : '填入'}
              </button>
            </span>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────── 寵登網「前台」 ─────────────────────── */

const FRONT_NAV = ['動保相關網站', '寵物登記與查詢', '遺失與協尋', '業者名單與統計數據']
const STAFF_SYSTEMS = [
  '寵物行政資訊系統',
  '特定寵物業管理系統',
  '全國動物收容管理系統',
  '動保案件管理系統',
  '人員講習系統',
]

function FrontSite({ staffMenu, onToggleStaffMenu, onEnterConsole, dimmed }) {
  return (
    <div className={dimmed ? 'pointer-events-none' : ''}>
      <div className="relative">
        <div className="flex h-[46px] items-center gap-3 bg-[#2e7d52] px-4 text-white">
          <PetLogo />
          <div className="flex flex-col">
            <p className="text-[13px] leading-4 font-bold">寵物登記管理資訊網</p>
            <p className="text-[8px] leading-3 text-white/75">
              Pet Registration Information System
            </p>
          </div>
          <nav className="flex flex-1 items-center justify-end gap-4 text-[11px] font-medium">
            {FRONT_NAV.map((n) => (
              <span key={n} className="flex items-center gap-0.5">
                {n}
                <ChevronDown className="size-2.5" strokeWidth="2.5" />
              </span>
            ))}
            <button
              onClick={onToggleStaffMenu}
              className={`flex items-center gap-0.5 rounded-sm px-1.5 py-1 ${
                staffMenu ? 'bg-white/20' : ''
              }`}
            >
              工作人員入口
              <ChevronDown className="size-2.5" strokeWidth="2.5" />
            </button>
            <span>飼主登入</span>
            <Search className="size-3" />
          </nav>
        </div>

        {staffMenu && (
          <div className="absolute top-[46px] right-[86px] z-20 w-[122px] overflow-hidden rounded-b-sm border border-neutral-300 bg-white shadow-md">
            {STAFF_SYSTEMS.map((s, i) => (
              <button
                key={s}
                onClick={i === 0 ? onEnterConsole : undefined}
                className={`block w-full px-2.5 py-2 text-left text-[10px] leading-4 ${
                  i === 0
                    ? 'bg-[#f2c94c] font-bold text-neutral-900'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hero 公告輪播（官網是照片，這裡用漸層替代） */}
      <div className="relative h-[330px] bg-gradient-to-br from-[#4a5750] via-[#6f7d71] to-[#3d4741] px-10 pt-12">
        <p className="max-w-[860px] text-[30px] leading-[46px] font-bold text-white">
          115年3月31日起，因應資安風險，登入系統後須修改「登入帳號」及「高強度密碼」
        </p>
        <p className="mt-4 text-[13px] leading-6 font-medium text-white/95">
          「登入帳號」設定原則：
          <br />
          (1) 4 到 8 碼之「大寫」英文字母或數字
          <br />
          (2) 登入帳號之首個字元應與原帳號的英文字母相同（如原帳號為 V 開頭，登入帳號首個英文字母仍須為
          V）
        </p>
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full ${i === 0 ? 'bg-[#f2c94c]' : 'bg-white/70'}`}
            />
          ))}
        </div>
        <p className="absolute right-3 bottom-3 text-[8px] text-white/60">圖片來源：英國動保</p>
      </div>

      <div className="flex h-[120px] items-center justify-center px-10 text-[11px] text-neutral-400">
        （官網其餘區塊：寵物登記統計、常見問答、相關連結）
      </div>
    </div>
  )
}

function PetLogo() {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/70">
      <svg viewBox="0 0 24 24" className="size-4 text-white" fill="currentColor">
        <circle cx="7" cy="9" r="2" />
        <circle cx="12" cy="6.5" r="2" />
        <circle cx="17" cy="9" r="2" />
        <path d="M12 11.5c-2.6 0-4.7 2-4.7 4.3 0 1.6 1.2 2.7 2.9 2.7h3.6c1.7 0 2.9-1.1 2.9-2.7 0-2.3-2.1-4.3-4.7-4.3z" />
      </svg>
    </span>
  )
}

/* ─────────────────────── 登入後台 ─────────────────────── */

function LoginDialog({ account, setAccount, password, setPassword, captcha, setCaptcha, onSubmit }) {
  const ok = account.trim() && password.trim() && captcha.trim()
  return (
    <SiteOverlay>
      <div className="flex w-[540px] flex-col gap-4 rounded-sm bg-white px-10 py-6 shadow-lg">
        <p className="text-center text-[15px] leading-6 font-bold text-neutral-900">登入後台</p>

        <SiteRow label="帳號">
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="帳號"
            className="h-8 w-[164px] rounded-[3px] border border-neutral-300 px-2 text-[12px] outline-none focus:border-[#5b56c4]"
          />
        </SiteRow>

        <SiteRow label="密碼">
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密碼"
              className="h-8 w-[146px] rounded-[3px] border border-neutral-300 px-2 text-[12px] outline-none focus:border-[#5b56c4]"
            />
            <EyeOff className="size-4 text-neutral-500" />
          </div>
        </SiteRow>

        <SiteRow label="驗證碼">
          <div className="flex items-center gap-2">
            <input
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
              className="h-8 w-[66px] rounded-[3px] border border-neutral-300 px-2 text-[12px] outline-none focus:border-[#5b56c4]"
            />
            {/* 示範用：點圖形驗證碼即自動填入，demo 不會卡在辨識數字 */}
            <button
              onClick={() => setCaptcha(CAPTCHA)}
              title="點一下自動填入（示範用）"
              className="flex h-8 w-[92px] items-center justify-center rounded-[2px] border border-[#5b56c4] bg-[#eef0fb]"
            >
              <span className="font-serif text-[18px] leading-5 font-bold tracking-[0.06em] text-[#2b2f9c] italic">
                {CAPTCHA}
              </span>
            </button>
          </div>
        </SiteRow>

        <p className="pl-[76px] text-[10px] leading-4 text-neutral-500">97 秒後變更驗證碼～</p>

        <div className="mt-1 flex items-center justify-center gap-16">
          <button className="h-8 w-[84px] rounded-[3px] border border-[#b9b6e8] bg-[#f4f3fd] text-[12px] font-medium text-[#5b56c4]">
            重設密碼
          </button>
          <button
            onClick={() => ok && onSubmit()}
            disabled={!ok}
            className="h-8 w-[84px] rounded-[3px] bg-[#5b56c4] text-[12px] font-medium text-white disabled:opacity-40"
          >
            確認
          </button>
        </div>
      </div>
    </SiteOverlay>
  )
}

function OtpDialog({ otp, setOtp, onSubmit }) {
  return (
    <SiteOverlay>
      <div className="flex w-[540px] flex-col gap-3 rounded-sm bg-white px-8 py-6 shadow-lg">
        <div className="flex items-start gap-2 border-b-2 border-[#5b56c4] pb-3">
          <User className="size-4 shrink-0 text-[#2e7d52]" />
          <p className="text-[13px] leading-5 font-bold text-neutral-900">
            驗證碼已寄至以下 Email，請於 5 分鐘內輸入，300 秒後失效。
          </p>
        </div>

        <SiteRow label="信箱">
          <p className="text-[12px] leading-5 text-neutral-800">{STAFF_EMAIL}</p>
        </SiteRow>

        <SiteRow label="驗證碼">
          <div className="flex items-center gap-2">
            {/* 示範用：點欄位即自動帶入信中的驗證碼 */}
            <input
              value={otp}
              onFocus={() => setOtp(OTP_CODE)}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="請輸入信箱中的驗證碼"
              className="h-8 w-[228px] rounded-[3px] border border-neutral-300 px-2 text-[12px] outline-none placeholder:text-neutral-400 focus:border-[#5b56c4]"
            />
            <button
              onClick={() => otp.trim() && onSubmit()}
              disabled={!otp.trim()}
              className="h-8 rounded-[3px] border border-neutral-300 bg-neutral-100 px-3 text-[12px] font-medium text-neutral-700 disabled:opacity-40"
            >
              確認驗證碼
            </button>
          </div>
        </SiteRow>
      </div>
    </SiteOverlay>
  )
}

function SiteOverlay({ children }) {
  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center bg-black/45 pt-[118px]">
      {children}
    </div>
  )
}

function SiteRow({ label, children }) {
  return (
    <div className="flex items-center gap-4">
      <p className="w-[60px] shrink-0 text-right text-[12px] leading-5 font-medium text-neutral-700">
        {label}
      </p>
      {children}
    </div>
  )
}

/* ─────────────────────── 寵登網「後台」 ─────────────────────── */

const CONSOLE_NAV = ['資料查詢', '辦理業務', '統計報表', '系統功能', '行政機關專區', '前台功能']
const QUERY_MENU = ['資料簡易查詢', '進階資料查詢', '寵物飼主資料查詢']
const NEWS = [
  ['2026/06/04', '沐訊科技', '自 6 月 29 日起導入電子郵件 2 次驗證機制'],
  ['2025/06/03', '沐訊科技', '7 月 1 日起寵物登記管理系統只有有庫存的晶片可辦理寵物登記'],
  ['2025/06/17', '沐訊科技', '訂定「犬、貓美容定型化契約應記載及不得記載事項」，並自即日生效'],
]

function ConsoleSite({
  step,
  queryMenu,
  onToggleQueryMenu,
  onAdvanced,
  form,
  setField,
  autoFilled,
  rows,
  picked,
  setPicked,
  onSearch,
  onBackToForm,
}) {
  return (
    <div>
      <div className="relative">
        <div className="flex h-[38px] items-center gap-3 bg-gradient-to-r from-[#a8873f] via-[#c6a967] to-[#ac8c48] px-3 text-white">
          <PetLogo />
          <div className="flex flex-col">
            <p className="text-[11px] leading-[14px] font-bold">寵物登記管理資訊網</p>
            <p className="text-[7px] leading-[10px] text-white/75">
              Pet Registration Information System
            </p>
          </div>
          <nav className="flex flex-1 items-center justify-end gap-3 text-[11px] font-medium">
            {CONSOLE_NAV.map((n) =>
              n === '資料查詢' ? (
                <button
                  key={n}
                  onClick={onToggleQueryMenu}
                  className={`flex items-center gap-0.5 rounded-sm px-1.5 py-1 ${
                    queryMenu ? 'bg-white/25' : ''
                  }`}
                >
                  <Search className="size-2.5" />
                  {n}
                  <ChevronDown className="size-2.5" strokeWidth="2.5" />
                </button>
              ) : (
                <span key={n} className="flex items-center gap-0.5 px-1.5 py-1">
                  {n}
                  <ChevronDown className="size-2.5" strokeWidth="2.5" />
                </span>
              ),
            )}
            <span className="rounded-sm bg-white/25 px-2 py-0.5 text-[10px]">
              {STAFF_ACCOUNT}
            </span>
            <span className="text-[10px] whitespace-nowrap">⏱ 19:55</span>
          </nav>
        </div>

        {queryMenu && (
          <div className="absolute top-[38px] left-[330px] z-20 w-[110px] overflow-hidden rounded-b-sm border border-neutral-300 bg-white shadow-md">
            {QUERY_MENU.map((m) => (
              <button
                key={m}
                onClick={m === '進階資料查詢' ? onAdvanced : undefined}
                className="block w-full px-2.5 py-2 text-left text-[10px] leading-4 text-neutral-700 hover:bg-[#f3ead6]"
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {step === 'console' ? (
        <ConsoleHome />
      ) : (
        <AdvancedQuery
          step={step}
          form={form}
          setField={setField}
          autoFilled={autoFilled}
          rows={rows}
          picked={picked}
          setPicked={setPicked}
          onSearch={onSearch}
          onBackToForm={onBackToForm}
        />
      )}
    </div>
  )
}

function ConsoleHome() {
  return (
    <div>
      <div className="relative h-[120px] bg-gradient-to-r from-[#efe3cd] via-[#e6d5b6] to-[#d9c49b]">
        <p className="pt-11 pl-8 text-[18px] leading-7 font-bold text-neutral-700">
          新北市動物保護處　陳建宏，您好
        </p>
        {/* 官網底部是波浪扇貝形狀 */}
        <div
          className="absolute inset-x-0 bottom-0 h-3"
          style={{
            backgroundImage: 'radial-gradient(circle at 10px 12px, #fff 9px, transparent 9.5px)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      <div className="flex flex-col items-center gap-3 px-10 py-6">
        <p className="text-[15px] leading-6 font-bold text-neutral-700">❀ 最新消息 ❀</p>
        {NEWS.map(([date, org, title]) => (
          <div
            key={title}
            className="w-[420px] rounded-[3px] border border-[#cfe3cd] border-l-[3px] border-l-[#2e7d52] bg-white px-3 py-2"
          >
            <p className="text-[9px] leading-3 text-neutral-500">
              {date} {org}
            </p>
            <p className="mt-1 text-[11px] leading-4 font-medium text-[#2e7d52]">▸ {title}</p>
          </div>
        ))}
        <p className="text-[11px] leading-4 text-neutral-600">完整最新消息 ›</p>
      </div>
    </div>
  )
}

function AdvancedQuery({
  step,
  form,
  setField,
  autoFilled,
  rows,
  picked,
  setPicked,
  onSearch,
  onBackToForm,
}) {
  const empty = !form.ownerId.trim() && !form.ownerName.trim() && !form.chip.trim() && !form.rabies.trim()

  /* 查詢結果在表單下方，官網版面很長 —— 查完自動捲到結果，不然動檢員會以為沒查到。
     結果是頁面最後一段，直接把內嵌瀏覽器捲到底最穩（scrollIntoView 在這層 absolute
     捲動容器裡算出來的位置會偏掉）。 */
  const resultsRef = useRef(null)
  useEffect(() => {
    if (step !== 'results') return
    // 等表格排版完成再量 scrollHeight，否則會捲一半（差一個 frame 就差幾十 px）
    const id = setTimeout(() => {
      const sc = resultsRef.current?.closest('.scroll-thin')
      // 用瞬間捲動：smooth 的動畫會被表格 render 造成的 scroll anchoring 中斷，捲到一半就停
      if (sc) sc.scrollTop = sc.scrollHeight
    }, 60)
    return () => clearTimeout(id)
  }, [step])

  return (
    <div className="flex flex-col items-center gap-1 px-8 py-5">
      <p className="text-[15px] leading-6 font-bold text-neutral-700">❀ 進階資料查詢 ❀</p>
      <p className="text-[11px] leading-4 text-[#2e7d52] underline">進階資料查詢操作手冊下載</p>

      <div className="mt-3 w-[560px] overflow-hidden rounded-[3px] border border-neutral-200">
        <p className="bg-[#8dc63f] py-1.5 text-center text-[12px] leading-5 font-bold text-white">
          查詢資料
        </p>
        <div className="flex flex-col gap-2.5 bg-white px-4 py-3">
          <p className="text-center text-[11px] leading-4 font-medium text-[#c0392b]">
            請擇一輸入一種查詢條件
          </p>

          <SiteField label="飼主證件號碼">
            <SiteInput
              value={form.ownerId}
              onChange={(v) => setField('ownerId', v)}
              placeholder="身份證號／居留證／寵物許可證"
              w={228}
            />
          </SiteField>
          <p className="pl-[92px] text-[8px] leading-[13px] text-neutral-500">
            因內政部移民署於 110 年 1 月 2 日起實行外籍人士統一證號（居留證）換發作業，本單為更新舊資料，
            於 113 年 8 月 7 日更新已換發居留證之統一證號，倘舊式證號搜尋不到，請以新式證號重新搜尋。
          </p>

          <SiteField label="飼主姓名">
            <SiteInput
              value={form.ownerName}
              onChange={(v) => setField('ownerName', v)}
              placeholder="可輸入20個中文字或英文字"
              w={228}
            />
          </SiteField>

          <SiteField label="寵物晶片號碼">
            <div className="flex items-center gap-1.5">
              <SiteInput
                value={form.chip}
                onChange={(v) => setField('chip', v)}
                placeholder="限輸入英文和數字"
                w={172}
                highlight={autoFilled && form.chip.length > 0}
              />
              <span className="rounded-[2px] bg-[#8dc63f] px-1.5 py-1 text-[8px] leading-3 font-bold text-white">
                掃描條碼輸入
              </span>
            </div>
          </SiteField>

          <SiteField label="狂犬病證號">
            <SiteInput
              value={form.rabies}
              onChange={(v) => setField('rabies', v)}
              placeholder="限輸入英文和數字"
              w={228}
            />
          </SiteField>

          <div className="flex justify-center pt-1">
            <button
              onClick={() => !empty && step === 'advanced' && onSearch()}
              disabled={empty || step !== 'advanced'}
              className="h-6 w-14 rounded-[3px] bg-[#9fce7d] text-[11px] font-bold text-white disabled:opacity-40"
            >
              {step === 'searching' ? '查詢中' : '查詢'}
            </button>
          </div>
        </div>
      </div>

      {step === 'searching' && (
        <p className="mt-4 text-[12px] leading-5 font-medium text-neutral-600">
          查詢中，正在比對寵物登記資料庫…
        </p>
      )}

      {step === 'results' && (
        <div ref={resultsRef} className="mt-4 w-[720px] scroll-mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] leading-4 font-medium text-neutral-700">
              查詢結果共 <span className="font-bold text-neutral-900">{rows.length}</span> 筆
              {rows.length > 1 && '，請點選要帶回外勤小助手的寵物'}
            </p>
            <button onClick={onBackToForm} className="text-[11px] leading-4 text-[#2e7d52] underline">
              重新查詢
            </button>
          </div>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-[#f3ead6] text-neutral-700">
                {['', '寵物晶片號碼', '寵物名稱', '動物類別', '性別', '絕育', '狂犬病疫苗', '登記日期', '飼主'].map(
                  (h) => (
                    <th key={h} className="border border-neutral-300 px-1.5 py-1 font-bold">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr
                  key={p.chip}
                  onClick={() => setPicked(i)}
                  className={`cursor-pointer text-center ${
                    picked === i ? 'bg-[#eaf5e2]' : 'bg-white hover:bg-neutral-50'
                  }`}
                >
                  <td className="border border-neutral-300 px-1.5 py-1">
                    <span
                      className={`inline-block size-2.5 rounded-full border ${
                        picked === i ? 'border-[4px] border-[#2e7d52]' : 'border-neutral-400'
                      }`}
                    />
                  </td>
                  <td className="border border-neutral-300 px-1.5 py-1">{p.chip}</td>
                  <td className="border border-neutral-300 px-1.5 py-1">{p.name}</td>
                  <td className="border border-neutral-300 px-1.5 py-1">{p.species}</td>
                  <td className="border border-neutral-300 px-1.5 py-1">{p.gender}</td>
                  <td className="border border-neutral-300 px-1.5 py-1">{p.neutered}</td>
                  <td
                    className={`border border-neutral-300 px-1.5 py-1 ${
                      p.vaccine === '未施打' ? 'font-bold text-[#c0392b]' : ''
                    }`}
                  >
                    {p.vaccine}
                  </td>
                  <td className="border border-neutral-300 px-1.5 py-1">{p.registeredAt}</td>
                  <td className="border border-neutral-300 px-1.5 py-1">{OWNER.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SiteField({ label, children }) {
  return (
    <div className="flex items-center gap-3">
      <p className="w-[80px] shrink-0 text-right text-[11px] leading-4 font-medium text-neutral-700">
        {label}
      </p>
      {children}
    </div>
  )
}

function SiteInput({ value, onChange, placeholder, w, highlight }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: w }}
      className={`h-6 rounded-[2px] border px-1.5 text-[10px] outline-none placeholder:text-neutral-400 ${
        highlight
          ? 'border-field-600 bg-field-50 font-bold text-neutral-900'
          : 'border-neutral-300 bg-white text-neutral-900 focus:border-[#2e7d52]'
      }`}
    />
  )
}

/* ─────────────────────── 本檔用到、共用 icons.jsx 沒有的圖示 ─────────────────────── */



