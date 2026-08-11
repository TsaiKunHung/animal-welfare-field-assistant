import { useMemo, useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { Camera, Images } from '../components/icons.jsx'

/*
  F10 拍攝介面／補拍畫面 — Figma page 10904:2469
    F10-1   拍攝介面 拍攝前            (11432:5094) → shot === 0（左下角是空的相簿鈕）
    F10-1-1 拍攝介面 拍攝後(左下圖標出現) (11432:5030) → shot > 0（左下角變縮圖 + 紅色數字徽章）
  兩個 frame 差別只有左下角，所以合併在同一個 route 用 state.photos 計數切換。

  ⚠️ Figma 稿面的取景畫面是一張實拍貓照（asset URL 七天過期、離線 demo 連不到），
     這裡改成 CSS 漸層 + inline SVG 自繪的失焦室內場景，再加對焦框與三分格線。
  ⚠️ Figma 提示文字寫死「拍攝動物生活環境全景照片」；這裡改成讀 state.checklist
     第一個未完成且需要照片的項目，按下快門會真的 dispatch ADD_PHOTO 把它打勾。
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
const RotateCcw = (p) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8" />
    <path d="M3 3v5h5" />
  </Svg>
)

const isPhotoItem = (label) => label.startsWith('拍攝')

/** checklist 分組 → F7 的照片分類（F7 依「動物照片／環境照片」分組） */
const CATEGORY_BY_GROUP = {
  環境紀錄: '環境照片',
  動物狀況: '動物照片',
  飼主資訊: '動物照片',
}

export default function F10Camera() {
  const { state, dispatch } = useApp()

  /* 拍照 / 錄影（Figma 右側模式切換，錄影只是視覺狀態） */
  const [mode, setMode] = useState('photo')
  /* 快門白閃 */
  const [flash, setFlash] = useState(false)

  /* 目前正在拍攝的 checklist 項目：第一個未完成且需要照片的 */
  const target = useMemo(
    () => state.checklist.find((c) => !c.done && isPhotoItem(c.label)) ?? null,
    [state.checklist],
  )

  /* 本次進入拍攝介面後累積的張數（左下角徽章） */
  const [shot, setShot] = useState(0)

  const hint = target ? `提示：${target.label}。` : '提示：必拍項目已完成，可自由補拍佐證照片。'

  const shutter = () => {
    const n = state.photos.length + 1
    dispatch({
      type: 'ADD_PHOTO',
      payload: {
        id: `photo-${Date.now()}`,
        category: target ? (CATEGORY_BY_GROUP[target.group] ?? '動物照片') : '動物照片',
        label: target ? target.label : `現場補拍照片 ${n}`,
        checklistId: target ? target.id : null,
        tags: [],
      },
    })
    setShot((v) => v + 1)
    setFlash(true)
    setTimeout(() => setFlash(false), 160)
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-black">
      <Viewfinder />

      {/* 快門白閃 */}
      {flash && <div className="absolute inset-0 z-40 bg-white/70" />}

      {/* ── 左上：頁面標題（疊在取景畫面上，不是 72px 實心頂欄） ── */}
      <div className="absolute top-6 left-[29px] z-20 flex items-start gap-[7px] p-4">
        <Camera className="size-6 shrink-0 text-white" />
        <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-white">照片拍攝</p>
      </div>

      {/* ── 右上：完成（Figma F10 沒有出口，照 F7-5 的「完成」樣式補上，避免死路） ── */}
      <button
        onClick={() => navigate('f3')}
        className="absolute top-6 right-9 z-20 flex h-[38px] w-[68px] items-center justify-center rounded-md bg-white text-base leading-6 font-bold text-field-900"
      >
        完成
      </button>

      {/* ── 右側：快門與模式切換（Figma 中心點約在 x=1112 / y=417） ── */}
      <div className="absolute top-[46%] right-12 z-20 flex flex-col items-center gap-[31px]">
        <button
          onClick={shutter}
          aria-label="按下快門"
          className="relative flex size-[68px] items-center justify-center rounded-full border-[3px] border-white/70"
        >
          <span className="size-[62px] rounded-full bg-white transition-transform active:scale-90" />

          {/* 快門鈕上方：目前正在拍攝哪個 checklist 項目 */}
          <span className="absolute right-0 bottom-[calc(100%+16px)] flex w-[240px] flex-col items-end gap-0.5 rounded-md bg-field-900/60 px-3 py-2 text-right">
            <span className="text-xs leading-[18px] font-medium text-field-300">
              {target ? `正在拍攝｜${target.group}` : '自由補拍'}
            </span>
            <span className="text-sm leading-5 font-bold text-white">
              {target ? target.label : '所有必拍項目已完成'}
            </span>
          </span>
        </button>

        <div className="flex w-[40px] flex-col items-start gap-3.5">
          <button
            onClick={() => setMode('photo')}
            className={`text-xl leading-[30px] font-bold ${
              mode === 'photo' ? 'text-field-300' : 'text-white'
            }`}
          >
            拍照
          </button>
          <button
            onClick={() => setMode('video')}
            className={`text-xl leading-[30px] font-bold ${
              mode === 'video' ? 'text-field-300' : 'text-white'
            }`}
          >
            錄影
          </button>
        </div>
      </div>

      {/* ── 底部：左下縮圖（帶張數徽章）＋ 中央提示 ── */}
      <div className="absolute bottom-[43px] left-8 z-20 flex items-center gap-[238px]">
        <div className="relative shrink-0">
          {shot === 0 ? (
            <div className="flex items-center justify-center rounded-md bg-field-900/50 p-2 shadow-md">
              <Images className="size-[39px] text-white" />
            </div>
          ) : (
            <button
              onClick={() => navigate('f7')}
              aria-label="檢視已拍攝照片"
              className="relative block size-12 overflow-hidden rounded-md border-2 border-white shadow-md"
            >
              <ThumbArt />
            </button>
          )}
          {shot > 0 && (
            <span className="absolute -top-3 left-9 flex size-6 items-center justify-center rounded-xl border-2 border-white bg-danger text-xs leading-[18px] font-medium text-white">
              {shot}
            </span>
          )}
        </div>

        <div className="flex h-12 items-center rounded-md bg-field-900/50 px-3 py-2.5 shadow-md">
          <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-white">{hint}</p>
        </div>
      </div>

      {/* ── 右下：重拍（把本次計數歸零，不刪照片；Figma 無此鈕，為 demo 補的復原出口） ── */}
      {shot > 0 && (
        <button
          onClick={() => setShot(0)}
          className="absolute right-9 bottom-[43px] z-20 flex h-12 items-center gap-2 rounded-md bg-field-900/50 px-4 text-sm leading-5 font-bold text-white"
        >
          <RotateCcw className="size-[18px]" />
          重新計數
        </button>
      )}
    </div>
  )
}

/* ── 取景畫面：CSS 漸層 + inline SVG 自繪的失焦室內場景 ＋ 三分格線 ＋ 對焦框 ── */
function Viewfinder() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(165deg,#6c7d78 0%,#4d5c58 32%,#33403d 66%,#1c2624 100%)',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1194 834"
        preserveAspectRatio="none"
        style={{ filter: 'blur(20px)' }}
      >
        {/* 後陽台鐵窗透光 */}
        <rect x="700" y="0" width="494" height="470" fill="#7f918c" opacity="0.5" />
        <rect x="860" y="0" width="14" height="470" fill="#4a5a56" opacity="0.6" />
        <rect x="1020" y="0" width="14" height="470" fill="#4a5a56" opacity="0.6" />
        {/* 牆面與地坪 */}
        <rect x="0" y="470" width="1194" height="364" fill="#20292a" opacity="0.85" />
        <rect x="0" y="0" width="700" height="470" fill="#3a4644" opacity="0.45" />
        {/* 鐵籠陰影 */}
        <rect x="150" y="300" width="420" height="300" rx="18" fill="#0d1414" opacity="0.55" />
        {/* 犬隻剪影 */}
        <ellipse cx="520" cy="560" rx="180" ry="120" fill="#5b514a" opacity="0.75" />
        <ellipse cx="640" cy="470" rx="86" ry="80" fill="#6a5f56" opacity="0.75" />
        <ellipse cx="700" cy="440" rx="22" ry="34" fill="#4c433c" opacity="0.7" />
        {/* 飲水盆 */}
        <ellipse cx="930" cy="690" rx="90" ry="42" fill="#39474a" opacity="0.8" />
      </svg>

      {/* 三分格線 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-0 left-0 h-px bg-white/15" />
        <div className="absolute top-2/3 right-0 left-0 h-px bg-white/15" />
        <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/15" />
        <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/15" />
      </div>

      {/* 對焦框 */}
      <div className="absolute top-1/2 left-[46%] size-[190px] -translate-x-1/2 -translate-y-1/2">
        <FocusCorner className="top-0 left-0" />
        <FocusCorner className="top-0 right-0 rotate-90" />
        <FocusCorner className="right-0 bottom-0 rotate-180" />
        <FocusCorner className="bottom-0 left-0 -rotate-90" />
        <div className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-field-300" />
      </div>

      {/* 邊緣壓暗（讓白色 UI 讀得清楚） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  )
}

function FocusCorner({ className = '' }) {
  return (
    <svg viewBox="0 0 28 28" className={`absolute size-7 text-field-300 ${className}`} fill="none">
      <path d="M27 1H1v26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/* 左下角縮圖：不引外部圖片，用漸層 + 剪影自繪 */
function ThumbArt() {
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <defs>
        <linearGradient id="f10thumb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6f7d78" />
          <stop offset="100%" stopColor="#2b3634" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" fill="url(#f10thumb)" />
      <ellipse cx="22" cy="34" rx="16" ry="10" fill="#5b514a" opacity="0.9" />
      <circle cx="32" cy="24" r="8" fill="#6a5f56" opacity="0.9" />
      <rect x="0" y="0" width="48" height="12" fill="#8b9a95" opacity="0.5" />
    </svg>
  )
}
