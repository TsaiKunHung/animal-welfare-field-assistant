import { useMemo, useRef, useState } from 'react'
import { useApp } from '../store/AppState.jsx'
import { navigate } from '../router.jsx'
import { Modal, Placeholder } from '../components/ui.jsx'
import { ChevronDown, ChevronLeft, ChevronRight } from '../components/icons.jsx'

/*
  F1 單日行程規劃頁 — Figma page 10904:2204 / frame 10904:2205
  版型數值來自 get_design_context：
    Top nav 10904:2206  — h72 / bg field-900 / pl20 pr36 / back 48 r12 border-2 field-700
    Panel / Day Route 11278:5756 — w560 / p24 / gap16 / r16 / 地圖 h280 r12 / 案件列 h66 r10
    Panel / 綜合提醒事項 11605:11897 — w598 / p24 / gap16 / 分段卡 r8 px16 py14 / 條目 r6 px10 py6

  與 Figma 的刻意差異（原型可用性需要）：
  - 地圖不引用 Figma 的 map 圖檔（asset URL 7 天過期、離線 demo 會掛）→ CSS 漸層 + inline SVG 示意圖，
    右上角標「路線示意」。Marker 座標沿用 Figma 的相對位置。
  - 「相關法律內容」在 Figma 是外開 Google 搜尋連結；demo 走離線，改成點擊開 Modal 顯示條文摘要。
  - 案件排序：Figma 只有拖曳把手。這裡保留把手＋桌機 HTML5 drag，另加上下箭頭（iPad Safari 不支援 drag）。
*/

// 地圖 Marker / 案件色票 —— 來自 Figma Blue600 / Green600 / Rose600（非 token 色，示意圖專用）
const TONES = [
  { bg: '#2563eb', soft: '#bfdbfe' },
  { bg: '#16a34a', soft: '#bbf7d0' },
  { bg: '#e11d48', soft: '#fecdd3' },
  { bg: '#7c3aed', soft: '#ddd6fe' },
]
const LETTERS = ['A', 'B', 'C', 'D']

// 第 2～4 件案件（第 1 件取自全域 state.activeCase）
const EXTRA_CASES = [
  {
    id: 'AC-1150811-007',
    title: '民生路柴犬｜板橋區',
    type: '疑似虐待或不當對待',
    address: '新北市板橋區民生路二段 456 號',
    contact: '謝小姐',
    phone: '0923-456-789',
    animal: '犬 / 柴犬 / 1 隻（母）',
    summary:
      '民眾通報犬隻長時間拴綁於頂樓鐵皮加蓋處，繩長不足一公尺、無遮蔽與飲水，近期有明顯掉毛與皮膚紅腫。',
    eta: '11:20 到',
    map: { x: 334, y: 72 },
  },
  {
    id: 'AC-1150811-012',
    title: '中山路寵物店｜三重區',
    type: '寵物業定期稽查',
    address: '新北市三重區中山路二段 88 號 1 樓',
    contact: '林先生（負責人）',
    phone: '0934-567-890',
    animal: '犬 12 隻 / 貓 6 隻（在售）',
    summary:
      '本季寵物業定期稽查。重點核對特定寵物業許可證、繁殖犬貓數量與晶片登記，並查核籠舍面積與清潔頻率紀錄。',
    eta: '13:40 到',
    map: { x: 364, y: 171 },
  },
  {
    id: 'AC-1150811-015',
    title: '思源路流浪犬群｜新莊區',
    type: '流浪犬通報',
    address: '新北市新莊區思源路 320 巷口空地',
    contact: '里長辦公室 李幹事',
    phone: '02-2996-1234',
    animal: '犬 / 米克斯 / 約 3 隻',
    summary:
      '里長通報空地聚集流浪犬約 3 隻，其中 1 隻疑似有跛行情形，民眾反映夜間追車。需現場評估是否誘捕收容。',
    eta: '15:10 到',
    map: { x: 450, y: 224 },
  },
]

const TOOLS = ['捕犬網、捕貓網與抓捕籠', '晶片掃描器與空白晶片', '防咬手套、隔離籠與消毒用品']

const EVIDENCE = ['記錄籠舍大小與環境整潔', '拍攝食物與飲水狀態', '記錄動物數量及精神狀態']

const LAWS = [
  {
    label: '動物保護法 第 5 條：飼主照護責任',
    body: '飼主應提供動物必要之食物、飲水及充足之活動空間，並提供其安全、乾淨、通風、排水、適當之溫度與照明之生活環境；動物受傷或罹患疾病時，應給予適當之醫療。',
  },
  {
    label: '動物保護法 第 22 條：寵物應辦理登記、植入晶片及依規定絕育',
    body: '寵物出生後四個月內，飼主應向直轄市、縣（市）主管機關辦理登記、植入晶片；特定寵物並應依規定完成絕育或申報未絕育原因。',
  },
  {
    label: '動物保護法 第 27 條：未依規定辦理登記、絕育者，處五萬元以上二十五萬元以下罰鍰',
    body: '未依規定辦理特定寵物之營業許可或登記者，處新臺幣五萬元以上二十五萬元以下罰鍰，並得限期令其改善；屆期未改善者，得按次處罰。',
  },
  {
    label: '動物保護法 第 30 條：不當飼養者，處三千元以上一萬五千元以下罰鍰，並得限期改善',
    body: '未依第五條規定提供動物適當之食物、飲水、活動空間或醫療者，處新臺幣三千元以上一萬五千元以下罰鍰，並得限期令其改善；屆期未改善者，得按次處罰。',
  },
  {
    label: '新北市動物保護自治條例相關規定',
    body: '新北市動物保護自治條例就犬隻出入公共場所之管理、放養與繫繩義務、寵物業設施標準等訂有補充規定，稽查時併同適用。',
  },
]

function Handle() {
  // Figma 的 Drag Handle 是 16×24 的六點圖形（不屬於 lucide icon set，故留在本檔）
  return (
    <svg viewBox="0 0 16 24" className="h-6 w-4 shrink-0 text-neutral-400" fill="currentColor">
      {[7, 12, 17].map((cy) =>
        [5, 11].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" />),
      )}
    </svg>
  )
}

function Maximize({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  )
}

function Marker({ letter, tone, className = '' }) {
  return (
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs leading-[18px] font-bold text-white ${className}`}
      style={{ background: tone.bg }}
    >
      {letter}
    </span>
  )
}

function PhotoThumb({ n, tone }) {
  return (
    <div className="relative flex h-[69px] w-24 shrink-0 flex-col justify-end overflow-hidden rounded-sm">
      <Placeholder label="" tone={tone} className="absolute inset-0" />
      <div className="relative flex items-center bg-[rgba(0,0,0,0.55)] px-1.5 py-[3px]">
        <span className="text-xs leading-[18px] font-medium text-white">照片 {n}</span>
        <span className="h-1 flex-1" />
        <Maximize className="size-[11px] text-white" />
      </div>
    </div>
  )
}

/* 路線示意圖 —— 純 CSS 漸層 + inline SVG，不引任何外部圖片 */
function RouteMap({ cases, selectedId }) {
  const here = [68, 224]
  const pts = [here, ...cases.map((c) => [c.map.x + 12, c.map.y + 12])]
  const line = pts.map((p) => p.join(',')).join(' ')
  const [fx, fy] = pts[1] ?? here

  return (
    <div className="relative h-[280px] w-full shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#eef3f1] via-[#e9eeec] to-[#dde5e2]">
      <svg
        viewBox="0 0 512 280"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* 綠地 */}
        <ellipse cx="45" cy="30" rx="85" ry="70" fill="#dcebdf" />
        <ellipse cx="480" cy="260" rx="80" ry="60" fill="#dcebdf" />
        {/* 水域 */}
        <path
          d="M-10 92 C 58 108, 88 150, 72 290 L 26 290 C 44 162, 18 116, -10 114 Z"
          fill="#d8e7f0"
        />
        {/* 街廓 */}
        <g fill="#e8edeb" opacity="0.75">
          <rect x="160" y="14" width="60" height="42" rx="3" />
          <rect x="228" y="14" width="66" height="42" rx="3" />
          <rect x="160" y="76" width="60" height="52" rx="3" />
          <rect x="228" y="76" width="66" height="52" rx="3" />
          <rect x="318" y="14" width="52" height="42" rx="3" />
          <rect x="318" y="76" width="52" height="52" rx="3" />
          <rect x="382" y="76" width="42" height="52" rx="3" />
          <rect x="160" y="152" width="60" height="54" rx="3" />
          <rect x="228" y="152" width="66" height="54" rx="3" />
          <rect x="318" y="152" width="52" height="54" rx="3" />
          <rect x="96" y="14" width="38" height="42" rx="3" />
          <rect x="96" y="152" width="38" height="54" rx="3" />
          <rect x="382" y="226" width="42" height="42" rx="3" />
        </g>
        {/* 道路 */}
        <g stroke="#ffffff" strokeLinecap="square">
          <line x1="-10" y1="258" x2="522" y2="52" strokeWidth="13" />
          <line x1="0" y1="139" x2="512" y2="139" strokeWidth="16" />
          <line x1="149" y1="0" x2="149" y2="280" strokeWidth="16" />
          <line x1="0" y1="64" x2="512" y2="64" strokeWidth="6" />
          <line x1="0" y1="216" x2="512" y2="216" strokeWidth="6" />
          <line x1="305" y1="0" x2="305" y2="280" strokeWidth="7" />
          <line x1="432" y1="0" x2="432" y2="280" strokeWidth="6" />
          <line x1="224" y1="0" x2="224" y2="280" strokeWidth="4" />
          <line x1="376" y1="0" x2="376" y2="280" strokeWidth="4" />
          <line x1="60" y1="0" x2="60" y2="280" strokeWidth="4" />
          <line x1="0" y1="104" x2="512" y2="104" strokeWidth="4" />
          <line x1="0" y1="176" x2="512" y2="176" strokeWidth="4" />
          <line x1="0" y1="248" x2="512" y2="248" strokeWidth="4" />
        </g>
        {/* 地標點 */}
        <g fill="#c2cdc9">
          <circle cx="196" cy="118" r="2.5" />
          <circle cx="266" cy="70" r="2.5" />
          <circle cx="342" cy="196" r="2.5" />
          <circle cx="104" cy="188" r="2.5" />
        </g>
        {/* 路線（點狀） */}
        <polyline
          points={line}
          fill="none"
          stroke="#3730a3"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="0.1 11"
        />
        {/* 現在地 */}
        <rect x="42" y="212" width="52" height="24" rx="6" fill="#102a43" />
        <text x="68" y="228" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff">
          現在地
        </text>
        {/* 第一站到達時間 */}
        <rect x={fx - 32} y={fy - 43} width="63" height="24" rx="6" fill="#ffffff" />
        <text
          x={fx - 0.5}
          y={fy - 27}
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="#1d4ed8"
        >
          {cases[0]?.eta ?? ''}
        </text>
        {/* 案件 Marker */}
        {cases.map((c, i) => {
          const tone = TONES[i % TONES.length]
          const cx = c.map.x + 12
          const cy = c.map.y + 12
          return (
            <g key={c.id}>
              {selectedId === c.id && (
                <circle cx={cx} cy={cy} r="17" fill="none" stroke={tone.bg} strokeWidth="2" opacity="0.4" />
              )}
              <circle cx={cx} cy={cy} r="12" fill={tone.bg} />
              <text
                x={cx}
                y={cy + 4.5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="#ffffff"
              >
                {LETTERS[i]}
              </text>
            </g>
          )
        })}
        {/* 這是示意圖，不是真實地圖 */}
        <rect
          x="416"
          y="12"
          width="84"
          height="24"
          rx="6"
          fill="#ffffff"
          fillOpacity="0.92"
          stroke="#d4d4d4"
        />
        <text x="458" y="28" textAnchor="middle" fontSize="12" fontWeight="500" fill="#737373">
          路線示意
        </text>
      </svg>
    </div>
  )
}

function SectionCard({ children }) {
  return (
    <div className="flex w-full flex-col gap-2.5 rounded-md border border-neutral-200 bg-white px-4 py-3.5">
      {children}
    </div>
  )
}

function WorkItem({ children }) {
  return (
    <div className="flex w-full items-center rounded-sm bg-neutral-50 px-2.5 py-1.5 text-[13px] leading-4 text-neutral-700">
      {children}
    </div>
  )
}

export default function F1DayRoute() {
  const { state } = useApp()

  const initialCases = useMemo(() => {
    const a = state.activeCase
    return [
      {
        id: a.id,
        title: '文化路米克斯犬｜板橋區',
        type: a.type,
        address: a.address,
        contact: a.reporter.name,
        phone: a.reporter.phone,
        animal: `${a.animal.species} / ${a.animal.breed} / ${a.animal.count} 隻（${a.animal.gender}）`,
        summary: a.description,
        eta: '10:30 到',
        map: { x: 146, y: 167 },
      },
      ...EXTRA_CASES,
    ]
  }, [state.activeCase])

  const [cases, setCases] = useState(initialCases)
  const [selectedId, setSelectedId] = useState(initialCases[0].id)
  const [law, setLaw] = useState(null)
  const cardRefs = useRef({})

  /* ── 拖曳排序 ──
     Figma 只畫了拖曳把手。iPad Safari 不會觸發 HTML5 的 drag 事件，
     所以改用 pointer 事件自己算：按住把手 → 依指標 Y 找出要插入的位置 → 放開才真的搬移。 */
  const rowRefs = useRef({})
  const [dragId, setDragId] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const dragState = useRef(null)

  const startDrag = (e, index, id) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragState.current = { from: index, to: index }
    setDragId(id)
    setOverIndex(index)

    const onMove = (ev) => {
      /* 用每一列的中線判斷指標現在落在第幾格 */
      const rows = cases.map((c) => rowRefs.current[c.id]).filter(Boolean)
      let to = rows.length - 1
      for (let k = 0; k < rows.length; k += 1) {
        const r = rows[k].getBoundingClientRect()
        if (ev.clientY < r.top + r.height / 2) {
          to = k
          break
        }
      }
      dragState.current.to = to
      setOverIndex(to)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const { from, to } = dragState.current ?? {}
      dragState.current = null
      setDragId(null)
      setOverIndex(null)
      if (from == null || to == null || from === to) return
      setCases((prev) => {
        const next = [...prev]
        const [item] = next.splice(from, 1)
        next.splice(to, 0, item)
        return next
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }


  const selectCase = (id) => {
    setSelectedId(id)
    cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex h-full w-full flex-col bg-canvas" data-figma="10904:2205">
      {/* Top navigation / Field workspace — 10904:2206 */}
      <header className="flex h-18 shrink-0 items-center justify-between bg-field-900 pr-9 pl-5">
        <div className="flex items-center gap-3">
          <button
            className="flex size-12 items-center justify-center rounded-lg border-2 border-field-700 text-white"
            onClick={() => navigate('f0')}
            aria-label="返回"
          >
            <ChevronLeft className="size-6" />
          </button>
          <p className="text-xl leading-[30px] font-bold text-white">單日行程規劃</p>
        </div>
      </header>

      {/* Workspace Row — 11278:5755 */}
      <div className="flex min-h-0 flex-1 gap-3 px-3 py-2.5">
        {/* Panel / Day Route — 11278:5756 */}
        <section className="flex w-[560px] shrink-0 flex-col gap-4 overflow-hidden rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex w-full items-center gap-2">
            <div className="rounded-md bg-field-50 px-3 py-1">
              <p className="text-sm leading-5 font-bold whitespace-nowrap text-field-700">
                2026/8/11（二）今日
              </p>
            </div>
            <span className="size-2.5" />
            <p className="text-xs leading-[18px] font-medium text-neutral-500">
              {cases.length} 件案件
            </p>
          </div>

          <RouteMap cases={cases} selectedId={selectedId} />

          <p className="text-xs leading-[18px] font-medium text-neutral-500">拖曳以變更案件排序</p>

          <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            {cases.map((c, i) => {
              const tone = TONES[i % TONES.length]
              const active = selectedId === c.id
              return (
                <div
                  key={c.id}
                  ref={(el) => (rowRefs.current[c.id] = el)}
                  onClick={() => selectCase(c.id)}
                  className={`flex w-full shrink-0 cursor-pointer items-center gap-3 rounded-[10px] border bg-white px-3.5 py-3 transition-colors ${
                    dragId === c.id ? 'opacity-50' : ''
                  } ${active ? 'shadow-xs' : 'border-hairline hover:bg-neutral-50'} ${
                    overIndex === i && dragId !== c.id ? 'border-field-600' : ''
                  }`}
                  style={active && overIndex !== i ? { borderColor: tone.bg } : undefined}
                  data-figma="11278:5776"
                >
                  <span
                    onPointerDown={(e) => startDrag(e, i, c.id)}
                    className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
                  >
                    <Handle />
                  </span>
                  <Marker letter={LETTERS[i]} tone={tone} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-xs leading-[18px] font-medium text-neutral-500">
                      案件編號 {c.id}
                    </p>
                    <p className="truncate text-sm leading-5 font-bold text-neutral-900">
                      {c.title}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Panel / 綜合提醒事項 — 11605:11897 */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
            <p className="text-xl leading-[30px] font-bold text-field-900">綜合提醒事項</p>
            <p className="text-xs leading-[18px] font-medium text-neutral-500">
              不當飼養動物案件在現場偵察時，應詳細觀察動物的飲食、飲水、活動空間與健康物理狀態，並留意動物是否有充足、乾淨之飲食與食物，皆須妥善記錄與拍照。
              <br />
              現場人員應盡量以不干擾動物的方式進行拍攝，並以影片及照片完整記錄動物行為與環境現場。
            </p>

            <div className="h-px w-full shrink-0 bg-neutral-200" />
            <p className="text-sm leading-5 font-bold text-neutral-900">器具準備：</p>
            <SectionCard>
              {TOOLS.map((t) => (
                <WorkItem key={t}>{t}</WorkItem>
              ))}
            </SectionCard>

            <div className="h-px w-full shrink-0 bg-neutral-200" />
            <p className="text-sm leading-5 font-bold text-neutral-900">蒐證重點提醒：</p>
            <div className="flex w-full flex-col gap-1">
              <div className="flex h-7 w-full items-center gap-2">
                <p className="text-sm leading-5 font-medium text-neutral-700">蒐證重點</p>
                <span className="h-px flex-1" />
              </div>
              <SectionCard>
                {EVIDENCE.map((t) => (
                  <WorkItem key={t}>{t}</WorkItem>
                ))}
              </SectionCard>
            </div>

            <div className="h-px w-full shrink-0 bg-neutral-200" />
            <p className="text-sm leading-5 font-bold text-neutral-900">相關法律內容：</p>
            <div className="flex w-full flex-col gap-2 rounded-md border border-neutral-200 bg-white px-4 py-3.5">
              {LAWS.map((l) => (
                <button
                  key={l.label}
                  onClick={() => setLaw(l)}
                  className="flex h-7 w-full items-center gap-2 rounded-sm bg-neutral-50 px-2.5 text-left hover:bg-neutral-100"
                >
                  <span className="min-w-0 flex-1 truncate text-xs leading-[18px] text-neutral-700">
                    {l.label}
                  </span>
                  <ChevronRight className="size-3.5 shrink-0 text-neutral-500" />
                </button>
              ))}
            </div>

            <div className="h-px w-full shrink-0 bg-neutral-200" />

            {cases.map((c, i) => {
              const tone = TONES[i % TONES.length]
              const active = selectedId === c.id
              return (
                <div
                  key={c.id}
                  ref={(el) => (cardRefs.current[c.id] = el)}
                  className={`flex w-full shrink-0 flex-col gap-3 rounded-lg border bg-white p-4 ${
                    active ? 'shadow-sm' : 'border-neutral-200'
                  }`}
                  style={active ? { borderColor: tone.soft } : undefined}
                  data-figma="11605:11942"
                >
                  <div className="flex w-full items-center gap-2">
                    <Marker letter={LETTERS[i]} tone={tone} />
                    <p className="text-sm leading-5 font-bold text-neutral-900">{c.title}</p>
                    <span className="flex-1" />
                    <p className="text-xs leading-[18px] font-medium text-neutral-500">{c.eta}</p>
                  </div>

                  <p className="text-xs leading-[18px] font-bold text-neutral-900">案件資訊</p>
                  <ul className="ms-[18px] list-disc text-xs leading-[18px] font-medium text-neutral-500">
                    <li>案由：{c.type}</li>
                    <li>地址：{c.address}</li>
                    <li>動物：{c.animal}</li>
                    <li>
                      聯絡人：{c.contact}／{c.phone}
                    </li>
                  </ul>

                  <p className="text-xs leading-[18px] font-bold text-neutral-900">案件照片</p>
                  <div className="flex w-full items-start gap-2">
                    <PhotoThumb n={1} tone="photo" />
                    <PhotoThumb n={2} tone="street" />
                    <PhotoThumb n={3} tone="photo" />
                  </div>

                  <p className="text-xs leading-[18px] font-bold text-neutral-900">案件說明</p>
                  <p className="text-xs leading-[18px] font-medium text-neutral-500">{c.summary}</p>

                  <button
                    className="flex w-full items-center justify-center rounded-md bg-field-900 py-2.5 text-sm leading-5 font-bold text-white"
                    onClick={() => {
                      setSelectedId(c.id)
                      navigate('f2')
                    }}
                  >
                    查看詳細內容
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <Modal open={!!law} onClose={() => setLaw(null)} title={law?.label} width={640}>
        <div className="flex flex-col gap-3 px-6 py-5">
          <p className="text-sm leading-6 text-ink-sub">{law?.body}</p>
          <p className="text-xs leading-[18px] text-neutral-500">
            （原型示意，實際條文以全國法規資料庫為準）
          </p>
        </div>
      </Modal>
    </div>
  )
}
