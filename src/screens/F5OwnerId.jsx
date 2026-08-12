import { useEffect, useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { AiBadge, Button } from '../components/ui.jsx'
import {
  ArrowDownRight,
  Camera,
  ChevronLeft,
  Edit,
  User,
} from '../components/icons.jsx'

/*
  F5 飼主身分查詢 ★AI —— Figma page 10904:2464
    F5-1     飼主身分查詢 / 身分查詢          (10932:4436) → status 'scanning'（滿版相機 + 中央挖空框）
    F5-2-1   飼主身分查詢 / 掃描成功           (10932:4555) → status 'ocr'      （OCR 結果卡，唯讀）
    F5-2-1-1 掃描成功 / 資料編輯中             (12259:4206) → status 'ocrEdit'  （欄位可改）
    F5-2-2   手動輸入                          (12274:805)  → status 'manual'
    F5-2-2   手動輸入漏填                      (12274:1722) → manual + missing 標紅
    F5-2-2   手動輸入完成                      (12274:1433) → status 'manualSaved'
    對話框 component set                       (12274:1169) → 下面的 <IdDialog>（4 個 variant 都在裡面）

  ⚠️ Figma 的 F5-2-* 是「工作台 + 彈窗」整頁 frame；本專案 f5 是獨立路由，
     所以彈窗一律疊在 F5-1 的相機畫面上（同一個 route、useState 切狀態），不另開路由。
  ⚠️ 飼主資料一律匿名顯示（陳O玲 / A******890）—— 專案已定規格，
     Figma 稿面還是明碼（陳筱玲 / A234567890），這裡照規格修正。
  ⚠️ 相機畫面、身分證件一律 CSS 漸層 + inline SVG 自繪，不引 Figma asset URL（7 天過期）。
*/


/* OCR 辨識結果（AI 產出的假資料）—— 匿名格式見檔頭說明 */
const OCR_RESULT = {
  name: '陳O玲',
  idNumber: 'A******890',
  birth: '民國 57 年 6 月 5 日',
  phone: '0928-135-790',
  address: '新北市板橋區文化路一段 188 巷 12 號',
}

const FIELDS = [
  { key: 'name', label: '姓名：', placeholder: '陳O玲' },
  { key: 'idNumber', label: '身分證字號：', placeholder: 'A******890' },
  { key: 'birth', label: '出生年月日：', placeholder: '民國 57 年 6 月 5 日' },
  { key: 'phone', label: '聯絡電話：', placeholder: '09XX-XXX-XXX' },
  { key: 'address', label: '戶籍地址：', placeholder: '新北市…' },
]

const EMPTY = { name: '', idNumber: '', birth: '', phone: '', address: '' }

export default function F5OwnerId() {
  const { state, dispatch } = useApp()

  /* scanning → ocr → ocrEdit ／ manual → manualSaved */
  const [status, setStatus] = useState('scanning')
  const [form, setForm] = useState(OCR_RESULT)
  const [missing, setMissing] = useState(false)

  /* 掃描中 → 1.5 秒後辨識成功（純前端模擬，沒有真的 OCR） */
  useEffect(() => {
    if (status !== 'scanning') return
    const id = setTimeout(() => setStatus('ocr'), 1500)
    return () => clearTimeout(id)
  }, [status])

  const set = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }))

  const rescan = () => {
    setForm(OCR_RESULT)
    setMissing(false)
    setStatus('scanning')
  }

  const toManual = () => {
    setForm(EMPTY)
    setMissing(false)
    setStatus('manual')
  }

  const saveManual = () => {
    const incomplete = FIELDS.some((f) => !form[f.key].trim())
    setMissing(incomplete)
    if (!incomplete) setStatus('manualSaved')
  }

  /* 確認 → 寫進全域 state（F6 手動輸入身分證會自動帶入）→ 回工作台 */
  const confirm = () => {
    dispatch({
      type: 'SET_OWNER_ID',
      payload: {
        name: form.name,
        idNumber: form.idNumber,
        phone: form.phone,
        address: form.address,
        birth: form.birth,
        source: status === 'manualSaved' ? 'manual' : 'ocr',
      },
    })
    dispatch({ type: 'TOGGLE_CHECK', id: 'own-1', done: true })
    navigate('f3')
  }

  const dialogOpen = status !== 'scanning'

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-black">
      <CameraBackdrop />

      {/* ── 頂部標題列（Figma 是疊在相機畫面上的，不是 72px 實心頂欄） ── */}
      <div className="absolute top-[25px] left-[27px] z-20 flex items-center gap-4">
        <button
          onClick={() => navigate('f3')}
          className="flex size-12 items-center justify-center rounded-lg border-2 border-field-700 bg-field-900 text-white"
          aria-label="返回工作台"
        >
          <ChevronLeft className="size-6" />
        </button>
        <div className="flex items-center gap-3">
          <User className="size-[30px] text-white" />
          <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-white">
            飼主身分查詢
          </p>
        </div>
      </div>

      {/* ── 中央挖空掃描框 ── */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center">
        <div
          className="relative h-[354px] w-[560px]"
          style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }}
        >
          {/* 引導文字 */}
          <p className="absolute -top-[50px] left-1/2 w-[420px] -translate-x-1/2 text-center text-xl leading-[30px] font-bold text-white">
            「 請將身分證對準放在畫面框框之中 」
          </p>

          <IdCardArt />

          {/* 四角框線 31×31 */}
          <Corner className="-top-px -left-px" />
          <Corner className="-top-px -right-px rotate-90" />
          <Corner className="-right-px -bottom-px rotate-180" />
          <Corner className="-bottom-px -left-px -rotate-90" />

          {/* 四角對位箭頭（Figma arrow-down-right / -left / up-*） */}
          <ArrowDownRight className="absolute top-[17px] left-[17px] size-6 text-white/80" />
          <ArrowDownRight className="absolute top-[17px] right-[17px] size-6 -scale-x-100 text-white/80" />
          <ArrowDownRight className="absolute right-[17px] bottom-[17px] size-6 -scale-100 text-white/80" />
          <ArrowDownRight className="absolute bottom-[17px] left-[17px] size-6 -scale-y-100 text-white/80" />

          {/* 掃描中 */}
          {status === 'scanning' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex flex-col items-center rounded-xl bg-black/65 px-7 py-3">
                <span className="flex items-center p-2.5">
                  <Camera className="size-[22px] animate-pulse text-white" />
                </span>
                <p className="text-xl leading-[30px] font-bold text-white">掃描中...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 右下角：改走手動輸入備援路徑 ── */}
      {status === 'scanning' && (
        <div className="absolute right-0 bottom-0 z-20 flex w-full justify-end p-6">
          <button
            onClick={toManual}
            className="flex items-center justify-center gap-2 rounded-md border border-field-50 bg-field-50 px-5 py-3 text-base leading-6 font-bold text-field-700 shadow-xs"
          >
            <Edit className="size-5" />
            前往手動輸入
          </button>
        </div>
      )}

      {/* ── 彈窗（Figma「飼主身分查詢對話框」component set 的四個 variant） ── */}
      {dialogOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/[0.32]" />
          <IdDialog
            status={status}
            form={form}
            set={set}
            missing={missing}
            onEdit={() => setStatus('ocrEdit')}
            onSaveEdit={() => setStatus('ocr')}
            onEditManual={() => setStatus('manual')}
            onSaveManual={saveManual}
            onRescan={rescan}
            onConfirm={confirm}
          />
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── 對話框 ───────────────────────── */

function IdDialog({
  status,
  form,
  set,
  missing,
  onEdit,
  onSaveEdit,
  onEditManual,
  onSaveManual,
  onRescan,
  onConfirm,
}) {
  const isScan = status === 'ocr' || status === 'ocrEdit'
  const editable = status === 'ocrEdit' || status === 'manual'

  return (
    <div className="relative flex w-[347px] flex-col gap-6 rounded-md bg-white p-6 shadow-lg">
      {/* 標題 */}
      <div className="flex items-center gap-3">
        <User className="size-[30px] shrink-0 text-neutral-900" />
        <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-neutral-900">
          {isScan ? '飼主身分查詢' : '手動輸入飼主身份'}
        </p>
        {isScan && <AiBadge className="ml-auto shrink-0">AI 辨識</AiBadge>}
      </div>

      {/* 掃描成功 */}
      {isScan && (
        <div className="flex w-full flex-col items-center justify-center gap-[3px]">
          <CheckMark />
          <p className="px-3 text-lg leading-7 font-bold text-ink">掃描成功！</p>
        </div>
      )}

      {/* 欄位 */}
      <div className="flex w-full flex-col gap-2">
        {FIELDS.map((f) => (
          <Row
            key={f.key}
            label={f.label}
            value={form[f.key]}
            placeholder={f.placeholder}
            onChange={set(f.key)}
            editable={editable}
            error={missing && !form[f.key].trim()}
            ai={status === 'ocr'}
            wrap={f.key === 'address'}
          />
        ))}
      </div>

      {missing && (
        <p className="-mt-3 text-xs leading-[18px] font-medium text-danger">
          尚有欄位未填寫，請補齊後再儲存。
        </p>
      )}

      {/* 底部動作 */}
      <div className="flex w-full items-center gap-2">
        {(status === 'ocr' || status === 'manualSaved') && (
          <button
            onClick={status === 'ocr' ? onEdit : onEditManual}
            className="flex items-center rounded-md border border-neutral-300 bg-white p-2 text-neutral-700"
            aria-label="修改資料"
          >
            <Edit className="size-4" />
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {status === 'ocr' && (
            <>
              <Button variant="secondary" size="sm" className="px-4 py-2.5" onClick={onRescan}>
                重新掃描
              </Button>
              <Button size="sm" className="px-4 py-2.5" onClick={onConfirm}>
                確認並保存
              </Button>
            </>
          )}
          {status === 'ocrEdit' && (
            <Button size="sm" className="px-4 py-2.5 font-medium" onClick={onSaveEdit}>
              儲存資料
            </Button>
          )}
          {status === 'manual' && (
            <>
              <Button variant="secondary" size="sm" className="px-4 py-2.5" onClick={onRescan}>
                返回掃描
              </Button>
              <Button size="sm" className="px-4 py-2.5 font-medium" onClick={onSaveManual}>
                儲存資料
              </Button>
            </>
          )}
          {status === 'manualSaved' && (
            <>
              <Button variant="secondary" size="sm" className="px-4 py-2.5" onClick={onRescan}>
                返回掃描
              </Button>
              <Button size="sm" className="px-4 py-2.5 font-medium" onClick={onConfirm}>
                確認
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* 資料列：唯讀（bg neutral-50 / label neutral-400）↔ 可編輯（bg white / label neutral-600） */
function Row({ label, value, placeholder, onChange, editable, error, ai, wrap }) {
  return (
    <div
      className={`flex w-full items-center justify-between gap-2 overflow-hidden rounded-[10px] py-3 pr-3 pl-3.5 ${
        wrap && !editable ? 'min-h-11' : 'h-11'
      } ${
        error
          ? 'border-2 border-danger bg-white'
          : editable
            ? 'border border-neutral-200 bg-white'
            : 'border border-neutral-200 bg-neutral-50'
      }`}
    >
      <span
        className={`shrink-0 text-sm leading-5 font-medium ${
          editable ? 'text-neutral-600' : 'text-neutral-400'
        }`}
      >
        {label}
      </span>
      {editable ? (
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-right text-sm leading-5 font-medium text-ink outline-none placeholder:text-neutral-300"
        />
      ) : (
        <span
          className={`text-right text-sm leading-5 font-medium ${wrap ? '' : 'truncate'} ${
            ai ? 'text-ai-700' : 'text-neutral-600'
          }`}
        >
          {value}
        </span>
      )}
    </div>
  )
}

/* 69px 的成功勾（Figma check icon） */
function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[69px] text-field-400" fill="none">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* 挖空框的四角 L 形框線 31×31 */
function Corner({ className = '' }) {
  return (
    <svg viewBox="0 0 31 31" className={`absolute size-[31px] text-field-400 ${className}`} fill="none">
      <path
        d="M30 1H1v29"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── 相機取景畫面：CSS 漸層 + inline SVG 自繪的失焦室內場景 ── */
function CameraBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg,#9aa6a8 0%,#7c898d 34%,#5b686d 68%,#3d474b 100%)',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1194 834"
        preserveAspectRatio="none"
        style={{ filter: 'blur(22px)' }}
      >
        {/* 落地窗 */}
        <rect x="620" y="0" width="574" height="620" fill="#c9d4d6" opacity="0.75" />
        <rect x="880" y="0" width="12" height="620" fill="#8b9799" opacity="0.7" />
        {/* 天花板燈帶 */}
        <rect x="0" y="0" width="620" height="90" fill="#b9c3c4" opacity="0.5" />
        {/* 遠處人影 */}
        <ellipse cx="250" cy="330" rx="86" ry="120" fill="#2f3a3e" opacity="0.55" />
        <ellipse cx="250" cy="200" rx="46" ry="52" fill="#3a4549" opacity="0.55" />
        <ellipse cx="960" cy="360" rx="70" ry="110" fill="#39444a" opacity="0.45" />
        <ellipse cx="960" cy="245" rx="38" ry="44" fill="#434e53" opacity="0.45" />
        {/* 前景桌面與植栽 */}
        <rect x="0" y="620" width="1194" height="214" fill="#2b3335" opacity="0.85" />
        <ellipse cx="1030" cy="700" rx="160" ry="130" fill="#3c5a44" opacity="0.75" />
        <ellipse cx="150" cy="720" rx="180" ry="110" fill="#232a2c" opacity="0.7" />
      </svg>
    </div>
  )
}

/* ── 挖空框內的身分證示意圖（非官方證件，僅示意；不引外部圖片） ── */
function IdCardArt() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 460 290" className="h-[290px] w-[460px] drop-shadow-lg">
        <rect x="0" y="0" width="460" height="290" rx="12" fill="#f2ece1" />
        <rect x="0" y="0" width="460" height="290" rx="12" fill="none" stroke="#d9cdb6" strokeWidth="2" />
        <rect x="330" y="0" width="8" height="290" fill="#cfe0dd" opacity="0.8" />

        <g fontFamily="var(--font-sans)">
          {/* SAMPLE 章 */}
          <rect x="24" y="36" width="150" height="38" rx="4" fill="none" stroke="#c0392b" strokeWidth="3" />
          <text x="34" y="63" fill="#c0392b" fontSize="26" fontWeight="700" letterSpacing="1.5">
            SAMPLE
          </text>
          <text x="190" y="62" fill="#c0392b" fontSize="26" fontWeight="700">
            示意用
          </text>
          <text x="190" y="88" fill="#c0392b" fontSize="14" fontWeight="500">
            非官方證件
          </text>

          {/* 資料列 */}
          <text x="26" y="140" fill="#3a3a3a" fontSize="17" fontWeight="500">姓　名</text>
          <text x="104" y="142" fill="#1b1b1b" fontSize="24" fontWeight="700" letterSpacing="4">陳O玲</text>

          <text x="26" y="182" fill="#3a3a3a" fontSize="15" fontWeight="500">出生年月日</text>
          <text x="124" y="182" fill="#1b1b1b" fontSize="17" fontWeight="500">民國 57 年 06 月 05 日</text>

          <text x="26" y="218" fill="#3a3a3a" fontSize="15" fontWeight="500">發證日期</text>
          <text x="124" y="218" fill="#1b1b1b" fontSize="17" fontWeight="500">民國 113 年 05 月 20 日</text>

          <text x="26" y="254" fill="#3a3a3a" fontSize="15" fontWeight="500">證件編號</text>
          <text x="124" y="254" fill="#1b1b1b" fontSize="17" fontWeight="500">A******890</text>

          {/* 照片 */}
          <rect x="352" y="26" width="88" height="112" rx="4" fill="#c8cdd0" />
          <circle cx="396" cy="70" r="22" fill="#9aa3a8" />
          <path d="M362 138c6-24 20-34 34-34s28 10 34 34z" fill="#9aa3a8" />
          <text x="360" y="178" fill="#3a3a3a" fontSize="16" fontWeight="500">性別　女</text>

          <rect x="352" y="212" width="88" height="42" rx="4" fill="none" stroke="#c0392b" strokeWidth="2.5" />
          <text x="360" y="240" fill="#c0392b" fontSize="17" fontWeight="700">僅供示意</text>
        </g>
      </svg>
    </div>
  )
}
