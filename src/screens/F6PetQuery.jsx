import { useEffect, useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import PetNet, { OWNER } from '../components/petnet.jsx'
import {
  Camera,
  Check,
  ChevronLeft,
  Cloud,
  FileText,
  Images,
  Search,
  User,
  X,
} from '../components/icons.jsx'

/*
  F6 寵物資訊查詢 ★AI —— Figma page「F6 寵物資訊查詢 NEW 0720 ★AI」(12486:5253)

  ★ 2026-08-11 改版重點：本地假資料庫查詢已整條移除，改走官方寵登網。
    農業部沒有開放系統介接，開發團隊無法在底層串接官方寵物登記資料庫；設計上的解法是
    「在外勤小助手內嵌一個瀏覽器」，動檢員直接在裡面操作寵物登記管理資訊網，
    再用「複製資料回外勤小助手」把查詢結果帶回本地紀錄。
    寵登網本體重建在 components/petnet.jsx，Figma 稿面上那幾張是貼上去的截圖。

  view 對照：
    choose     選擇查詢方式（掃晶片／輸入飼主證件號碼）—— 只是取得「查詢條件」
    chipIdle   晶片掃描 / 待掃描
    chipScanning / chipFail / chipDone / chipEdit   掃描中 / 失敗 / 完成 / 號碼可編輯
    idInput    手動輸入（或由 F5 自動帶入）飼主身分證字號
    petnet     內嵌寵登網            12486:5516 → 12542:1030（前台→登入→二次驗證→後台→進階查詢→結果）
    result     晶片號碼查詢結果      12544:3953

  ⚠️ Figma 每個 frame 都是「工作台 + Modal」；f6 是獨立路由，
     所以本檔自己畫一層靜態工作台襯底，彈窗疊在上面（同一路由、useState 切狀態）。
  ⚠️ 掃描「失敗」狀態 Figma 沒畫，但備援路徑（提示：現場若無法掃描晶片…）是設計重點，
     這裡補了 'chipFail'：第一次掃描失敗 → 可重掃或改走飼主證件號碼查詢。
  ⚠️ 飼主姓名在後台查詢結果是明碼「陳筱玲」（Figma 新稿 frame 12544:3953），
     因為那是動檢員以公務帳號登入後的授權查詢；對外／摘要類畫面仍用匿名格式，見 F12。
  ⚠️ 稿面舊版殘留：案件寫台北市/0927492927（本檔一律用 state.activeCase）。
*/

/* ── 本頁缺的圖示（不動共用 icons.jsx） ── */
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
const CreditCard = (p) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </Svg>
)
const MessageSquare = (p) => (
  <Svg {...p}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </Svg>
)
const BookOpen = (p) => (
  <Svg {...p}>
    <path d="M12 7v14M12 7a4 4 0 00-4-4H3v14h5a4 4 0 014 4M12 7a4 4 0 014-4h5v14h-5a4 4 0 00-4 4" />
  </Svg>
)
const AlertOctagon = (p) => (
  <Svg {...p}>
    <path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z" />
    <path d="M12 8v5M12 16.5v.01" />
  </Svg>
)
const Globe = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 2.5 15 0 18M12 3c-2.5 2.6-2.5 15 0 18" />
  </Svg>
)

const CHIP_NO = '900115000530794'

export default function F6PetQuery() {
  const { state, dispatch } = useApp()

  /* choose → chipIdle → chipScanning → chipFail / chipDone → chipEdit → petnet → result
     choose → idInput → petnet → result */
  const [view, setView] = useState('choose')
  const [chip, setChip] = useState(CHIP_NO)
  const [scanned, setScanned] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [pet, setPet] = useState(null)

  /* F5 掃過就自動帶入（兩功能資料互通 —— 這是設計重點） */
  const autofilled = !!state.ownerId?.idNumber
  const [idNo, setIdNo] = useState(state.ownerId?.idNumber ?? '')

  /* 掃描：第一次失敗（示範備援路徑），之後成功 */
  useEffect(() => {
    if (view !== 'chipScanning') return
    const id = setTimeout(() => {
      const ok = attempt > 1
      setScanned(ok)
      setView(ok ? 'chipDone' : 'chipFail')
    }, 1500)
    return () => clearTimeout(id)
  }, [view, attempt])

  const startScan = () => {
    setAttempt((v) => v + 1)
    setView('chipScanning')
  }

  /* 寵登網按下「複製資料回外勤小助手」→ 寫進全域
     （F13 附件清單會多一筆「寵物登記查詢結果紀錄」，F15 拾獲單的晶片欄位也會自動帶入） */
  const copyBack = (picked) => {
    setPet(picked)
    dispatch({
      type: 'SET_PET_RECORD',
      payload: {
        ...picked,
        owner: OWNER,
        queriedAt: '115/08/11 10:37',
        source: 'petnet', // 來源：官方寵物登記管理資訊網後台
      },
    })
    dispatch({ type: 'TOGGLE_CHECK', id: 'own-2', done: true })
    setView('result')
  }

  /* 帶入寵登網查詢表單的資料：晶片號碼來自剛剛的掃描，飼主資料來自 F5 或本頁輸入 */
  const prefill = {
    chip: scanned ? chip : '',
    ownerId: idNo.trim() || state.ownerId?.idNumber || '',
    ownerName: state.ownerId?.name || '',
  }

  const close = () => navigate('f3')

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas">
      <WorkbenchBackdrop />

      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/[0.32]" onClick={close} />

        {view === 'choose' && (
          <Dialog title="寵物晶片查詢" onClose={close}>
            <div className="mt-[39px] flex h-[336px] w-full items-center justify-center gap-3">
              <OptionCard
                Icon={Camera}
                title="掃描晶片號碼"
                desc="使用晶片掃描器讀取寵物晶片號碼"
                onClick={() => setView('chipIdle')}
              />
              <OptionCard
                Icon={CreditCard}
                title="輸入飼主證件號碼"
                desc="以飼主身分證字號查詢名下寵物"
                onClick={() => setView('idInput')}
              />
            </div>
            <div className="mt-[39px] flex w-full flex-col items-center gap-1.5">
              <div className="flex items-center justify-center gap-[5px]">
                <MessageSquare className="size-[15px] shrink-0 text-field-700" />
                <p className="text-sm leading-5 font-medium text-field-700">
                  提示：現場若無法掃描晶片，可使用飼主身分證查詢其名下所有寵物資料
                </p>
              </div>
              <div className="flex items-center justify-center gap-[5px]">
                <Globe className="size-[15px] shrink-0 text-neutral-500" />
                <p className="text-sm leading-5 font-medium text-neutral-500">
                  取得查詢條件後，會開啟官方「寵物登記管理資訊網」進行查詢
                </p>
              </div>
            </div>
          </Dialog>
        )}

        {/* ── 晶片掃描（idle / 掃描中 / 失敗 / 完成 / 編輯） ── */}
        {['chipIdle', 'chipScanning', 'chipFail', 'chipDone', 'chipEdit'].includes(view) && (
          <Dialog title="掃描晶片號碼" onClose={close}>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
              <ScannerArt />

              {/* 掃描框 */}
              {['chipIdle', 'chipScanning', 'chipFail'].includes(view) && (
                <div className="flex h-[224px] w-[354px] flex-col items-center justify-center gap-3 rounded-md border border-hairline bg-neutral-50">
                  {view === 'chipIdle' && (
                    <button
                      onClick={startScan}
                      className="rounded-md bg-field-600 px-3 py-1.5 text-sm leading-5 font-medium text-white shadow-xs"
                    >
                      開始掃描
                    </button>
                  )}
                  {view === 'chipScanning' && <Dots />}
                  {view === 'chipFail' && (
                    <>
                      <AlertOctagon className="size-9 text-danger" />
                      <p className="text-base leading-6 font-bold text-danger">
                        讀取不到晶片訊號
                      </p>
                      <p className="px-6 text-center text-xs leading-[18px] font-medium text-neutral-500">
                        請調整掃描器與動物的距離後再試一次，
                        <br />
                        或改用飼主身分證查詢名下寵物。
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          onClick={startScan}
                          className="rounded-md bg-field-600 px-3.5 py-2 text-sm leading-5 font-bold text-white shadow-xs"
                        >
                          重新掃描
                        </button>
                        <button
                          onClick={() => setView('idInput')}
                          className="rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-sm leading-5 font-bold text-neutral-700 shadow-xs"
                        >
                          改用身分證查詢
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 掃描完成 / 號碼編輯中 */}
              {(view === 'chipDone' || view === 'chipEdit') && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3">
                    {view === 'chipDone' ? (
                      <p className="text-2xl leading-8 font-bold text-field-700">{chip}</p>
                    ) : (
                      <input
                        autoFocus
                        value={chip}
                        onChange={(e) => setChip(e.target.value)}
                        className="h-11 w-[260px] rounded-md border border-field-200 bg-white px-3.5 text-base leading-6 font-medium text-neutral-900 outline-none"
                      />
                    )}
                    <button
                      onClick={() => setView(view === 'chipDone' ? 'chipEdit' : 'chipDone')}
                      className="text-neutral-900"
                      aria-label="修改晶片號碼"
                    >
                      <PenBox className="size-6" />
                    </button>
                  </div>
                  <button
                    onClick={() => setView('petnet')}
                    className="flex items-center gap-2 rounded-md bg-field-600 px-4 py-2 text-sm leading-5 font-bold text-white shadow-xs"
                  >
                    <Globe className="size-[18px]" />
                    開啟寵登網查詢
                  </button>
                  <button
                    onClick={() => setView('choose')}
                    className="text-sm leading-5 font-medium text-field-700 underline"
                  >
                    返回選擇查詢方式
                  </button>
                </div>
              )}

              {['chipIdle', 'chipScanning', 'chipFail'].includes(view) && (
                <p className="text-base leading-6 font-bold text-field-700">
                  「 請將晶片號碼放在畫面框框之中 」
                </p>
              )}
            </div>
          </Dialog>
        )}

        {/* ── 飼主證件號碼（手動輸入／F5 自動帶入） ── */}
        {view === 'idInput' && (
          <Dialog title="飼主證件號碼查詢" size="sm" onClose={close}>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
              {autofilled ? (
                <p className="flex items-center gap-2 text-base leading-6 font-bold text-field-700">
                  <Check className="size-5" />
                  已自動填入飼主身分證字號（可修改）
                </p>
              ) : (
                <p className="text-base leading-6 font-bold text-field-700">
                  請輸入飼主身分證字號（10 碼）
                </p>
              )}
              <input
                value={idNo}
                onChange={(e) => setIdNo(e.target.value)}
                placeholder="A123456789"
                className="h-11 w-[331px] rounded-[10px] border border-field-200 bg-white px-4 text-base leading-6 font-medium text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-field-600"
              />
              <button
                onClick={() => idNo.trim() && setView('petnet')}
                disabled={!idNo.trim()}
                className="flex items-center gap-2 rounded-md bg-field-600 px-4 py-2 text-sm leading-5 font-bold text-white shadow-xs disabled:opacity-40"
              >
                <Globe className="size-[18px]" />
                開啟寵登網查詢
              </button>
              <button
                onClick={() => setView('choose')}
                className="text-sm leading-5 font-medium text-field-700 underline"
              >
                返回選擇查詢方式
              </button>
            </div>
          </Dialog>
        )}

        {/* ── 內嵌寵物登記管理資訊網 ── */}
        {view === 'petnet' && (
          <Dialog title="查詢晶片號碼" size="net" onClose={close}>
            <PetNet prefill={prefill} onCopyBack={copyBack} />
          </Dialog>
        )}

        {/* ── 晶片號碼查詢結果（已帶回本地） ── */}
        {view === 'result' && pet && (
          <Dialog title="晶片號碼查詢結果" size="result" onClose={close}>
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex flex-1 items-center justify-center gap-9">
                <div className="flex h-[210px] w-[302px] flex-col items-center justify-center gap-1.5 rounded-md bg-neutral-100 px-3 py-2.5">
                  {[
                    ['晶片號碼：', pet.chip],
                    ['寵物名稱：', pet.name],
                    ['性別：', pet.gender],
                    ['絕育狀態：', pet.neutered],
                    ['疫苗登記：', pet.vaccine],
                    ['飼主名稱：', OWNER.name],
                  ].map(([k, v]) => (
                    <div key={k} className="flex w-[237px] items-start gap-2.5">
                      <p className="w-[101px] shrink-0 text-sm leading-5 font-medium text-neutral-600">
                        {k}
                      </p>
                      <p
                        className={`min-w-0 flex-1 text-right text-base leading-6 ${
                          v === '未施打'
                            ? 'font-bold text-danger'
                            : 'font-medium text-neutral-900'
                        }`}
                      >
                        {v}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex w-[326px] flex-col gap-4">
                  <p className="text-xl leading-[30px] font-bold text-neutral-900">快速操作</p>
                  <button
                    onClick={() => navigate('f10')}
                    className="flex h-12 w-full items-center justify-center gap-2.5 rounded-md bg-field-600 px-3 text-lg leading-7 font-bold text-white shadow-xs"
                  >
                    <Camera className="size-[22px]" />
                    立即拍照
                  </button>
                  <p className="text-sm leading-5 text-neutral-900">
                    立即為 <span className="font-bold text-field-600">{pet.name}</span>{' '}
                    拍攝照片，照片將自動綁定到此標籤
                  </p>
                  <p className="text-sm leading-5 text-field-600">
                    <span className="font-bold">✓ </span>多動物場景推薦使用
                    <br />
                    <span className="font-bold">✓ </span>避免後續標記混亂
                  </p>
                </div>
              </div>

              <div className="flex w-full shrink-0 items-center justify-center">
                <p className="text-base leading-6 font-bold text-field-700">
                  「複製成功，已於摘要處新增毛孩資訊」
                </p>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── 共用小元件 ───────────────────────── */

const PenBox = (p) => (
  <Svg {...p}>
    <path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z" />
  </Svg>
)

/* 對話框尺寸一律照 Figma frame：
   lg 869×645（選擇／掃描）、sm 507×377（輸入證件號碼）、
   net 1089×645（內嵌寵登網 12542:1030）、result 869×450（查詢結果 12544:3953） */
const DIALOG_SIZE = {
  lg: 'h-[645px] w-[869px]',
  sm: 'h-[377px] w-[507px]',
  net: 'h-[645px] w-[1089px]',
  result: 'h-[450px] w-[869px]',
}

function Dialog({ title, children, onClose, size = 'lg' }) {
  return (
    <div
      className={`relative flex flex-col gap-6 rounded-md bg-white p-6 shadow-lg ${DIALOG_SIZE[size]}`}
    >
      <div className="flex shrink-0 items-center gap-4">
        <Search className="size-[30px] shrink-0 text-neutral-900" />
        <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-neutral-900">
          {title}
        </p>
      </div>
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-neutral-900"
        aria-label="關閉"
      >
        <X className="size-6" />
      </button>
      {children}
    </div>
  )
}

function OptionCard({ Icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[225px] w-[355px] flex-col items-center justify-center gap-[7px] rounded-md bg-neutral-50 px-[19px] py-[13px] shadow-md hover:bg-field-50"
    >
      <Icon className="size-[70px] text-field-700" strokeWidth="1.5" />
      <span className="px-3 py-1 text-sm leading-5 font-bold text-field-700">{title}</span>
      <span className="px-3 text-sm leading-5 text-field-600">{desc}</span>
    </button>
  )
}

function Dots() {
  return (
    <div className="flex items-center gap-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 animate-pulse rounded-full bg-neutral-500"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  )
}

/* 晶片掃描器示意圖（不引外部圖片；紅框對應 Figma 圖上的取景框） */
function ScannerArt() {
  return (
    <svg viewBox="0 0 280 134" className="h-[134px] w-[280px]">
      <rect x="30" y="6" width="220" height="122" rx="16" fill="#e7eaec" />
      <rect x="30" y="6" width="220" height="122" rx="16" fill="none" stroke="#cdd3d6" strokeWidth="2" />
      <rect x="58" y="22" width="164" height="68" rx="6" fill="#12181b" />
      <text x="72" y="50" fill="#7fe3c8" fontSize="13" fontFamily="monospace">
        FDXB
      </text>
      <text x="72" y="72" fill="#7fe3c8" fontSize="13" fontFamily="monospace">
        900 115000530794
      </text>
      <rect x="64" y="32" width="152" height="50" rx="2" fill="none" stroke="#e5352b" strokeWidth="3" />
      <circle cx="108" cy="108" r="9" fill="#4f7fd1" />
      <circle cx="148" cy="110" r="11" fill="#3d6fc4" />
      <rect x="196" y="102" width="26" height="12" rx="3" fill="#9aa3a8" />
    </svg>
  )
}

/* ── 靜態工作台襯底（Figma 的 F6 frame 都是「工作台 + Modal」） ── */
function WorkbenchBackdrop() {
  const { state, checklistDone, checklistTotal } = useApp()
  const c = state.activeCase
  const tools = [
    { label: '飼主身分查詢', Icon: User },
    { label: '寵物晶片查詢', Icon: Search },
    { label: '瀏覽案件照片', Icon: Images },
    { label: '案件內容', Icon: FileText },
    { label: '筆記本', Icon: BookOpen },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col overflow-hidden">
      <header className="flex h-[72px] shrink-0 items-center justify-between bg-field-900 pr-9 pl-5">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-lg border-2 border-field-700 text-white">
            <ChevronLeft className="size-6" />
          </span>
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
          <span className="flex h-11 items-center rounded-md border border-neutral-300 bg-white px-4 text-sm leading-5 font-bold text-field-700 shadow-xs">
            完成現場紀錄
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-4 p-4">
        <nav className="flex w-[112px] shrink-0 flex-col gap-2 rounded-md bg-white p-2">
          {tools.map(({ label, Icon }) => (
            <span
              key={label}
              className="flex h-[112px] w-full shrink-0 flex-col items-center justify-center gap-2 rounded-md border border-field-200 bg-field-50 px-2 text-center text-sm leading-5 font-bold text-field-700"
            >
              <Icon className="size-6" />
              <span className="w-16">{label}</span>
            </span>
          ))}
        </nav>

        <section className="flex h-full w-[438px] shrink-0 flex-col overflow-hidden rounded-md bg-white">
          <div className="flex h-16 shrink-0 items-center justify-between px-5">
            <h2 className="text-xl leading-[30px] font-bold text-neutral-900">現場轉錄文字</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1.5 text-xs leading-[18px] font-bold text-neutral-500">
              <span className="size-2 rounded-full bg-neutral-400" />
              錄音中
            </span>
          </div>
          <div className="flex flex-col gap-4 px-5 pt-1 pb-6">
            <div className="rounded-sm bg-field-50 px-3 py-2.5">
              <p className="text-xs leading-[18px] font-medium text-field-700">
                逐字稿會隨錄音即時更新，資料已自動儲存。
              </p>
            </div>
            {state.transcript.slice(-4).map((s, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs leading-[18px] font-medium text-neutral-500">{s.t}</span>
                  <span className="text-xs leading-[18px] font-bold text-field-700">
                    {s.speaker}
                  </span>
                </div>
                <p className="text-sm leading-5 font-medium text-neutral-900">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-white">
          <div className="flex h-[88px] shrink-0 flex-col justify-center gap-1 px-5">
            <h2 className="text-xl leading-[30px] font-bold text-neutral-900">
              「{c.type}」蒐證清單
            </h2>
            <p className="text-xs leading-[18px] font-medium text-neutral-500">
              已完成 {checklistDone}／{checklistTotal}｜現場可新增臨時項目
            </p>
          </div>
          <div className="flex flex-col gap-2 px-4 pb-6">
            {state.checklist.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className={`flex h-[82px] items-center gap-3 rounded-md border px-3.5 ${
                  item.done ? 'border-field-200 bg-field-50' : 'border-neutral-200 bg-white'
                }`}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-sm border ${
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
                    {item.done ? '已完成' : '需要紀錄'}
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
            錄音中
          </span>
          <span className="text-sm leading-5 font-bold text-neutral-900">00:12:48</span>
        </div>
        <div className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1">
          {[10, 18, 28, 16, 34, 22, 12, 30, 20, 36, 16, 26, 12, 32, 18, 24, 14, 28, 10, 20, 34, 16, 22, 12].map(
            (h, i) => (
              <span key={i} className="w-1 rounded-[2px] bg-neutral-300" style={{ height: h }} />
            ),
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-12 w-[124px] items-center justify-center rounded-md border border-neutral-300 bg-white text-sm leading-5 font-bold text-field-700">
            標記重點
          </span>
          <span className="flex h-12 w-[124px] items-center justify-center rounded-md bg-danger text-sm leading-5 font-bold text-white">
            結束錄音
          </span>
        </div>
      </footer>
    </div>
  )
}
