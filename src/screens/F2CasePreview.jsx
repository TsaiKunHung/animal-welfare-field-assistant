import { useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { Modal, Placeholder } from '../components/ui.jsx'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Lock,
  Map,
  Maximize2,
  MoreHorizontal,
  X,
} from '../components/icons.jsx'

/*
  F2 案件預覽頁 — 出勤前確認頁
  Figma page 10904:2459「F2 案件預覽頁」，六個 frame：
    F2-1 案件預覽頁 DEFAULT      (10932:2473) → 主畫面
    F2-2 地址：街景圖            (11259:4005) → streetView 彈窗
    F2-3 / F2-3-1 報案人：查看鈕 (11259:3900 / 11357:5497) → reporterOpen 展開狀態
    F2-4 附圖預覽                (11127:9739) → photoIndex 彈窗
    F2-5 可參考案例視窗          (11127:3648) → refCases 彈窗
    F2-6 動保條文說明視窗        (11127:3789) → lawModal 彈窗
  子畫面全部在本檔用 useState 切換，不另開路由。
*/

/* 圖示一律用共用 icons.jsx（Feather），本頁不自繪。 */

/** Figma 稿面標題是「四維路米克斯貓｜大安區」，這裡改成與全域 activeCase 同一件案子 */
const CASE_TITLE = '文化路米克斯犬｜板橋區'

const EQUIPMENT = `捕犬網、晶片掃描器、拍攝用具、防咬手套。
捲尺、溫度計。
可攜式飲水器、毛巾、與消毒用品。`

const EVIDENCE_POINTS = [
  '重點拍攝並記錄居住環境整潔度、飼料與飲水狀態、飼養空間大小與通風情形，同時觀察動物皮膚、毛髮、體態與行為反應。',
  '若有異味、排泄物堆積、或明顯長期未清理情形，應詳細標註位置與時間。',
  '如有鄰居反映，應同步記錄陳述內容、音量狀況與噪音持續時間以利研判干擾程度。',
]

const CASE_SUMMARY =
  '不當飼養案件，地點位於住宅區，動物疑似處於不良環境，需現場勘查居住空間及寵物健康狀態，避免動物持續受苦並維護社區安寧。'

const REMARK =
  '由於案件地點位於住宅區，鄰里關係較為敏感，建議出勤前確保低調處理，不宜刺激鄰里關係，並優先與里長或管委會溝通口徑協調。'

const REF_CASES = [
  {
    title: '東區公寓不當飼養多貓案',
    tag: '已裁罰',
    body: '飼主於狹小套房飼養 8 隻貓咪，環境髒亂且未提供足夠飲水，經查獲後依法裁罰並要求改善飼養環境。',
    meta: '案件編號：0924123456　年份：2024',
  },
  {
    title: '南區民宅犬隻不當圈養案',
    tag: null,
    body: '飼主長期將犬隻圈養於狹小空間，無適當飲水與遮蔽，經檢舉後進行改善勸導並持續追蹤。',
    meta: '案件編號：0924789012　年份：2024',
  },
]

const LAW_ARTICLES = [
  {
    no: '第 5 條',
    lead: '動物之飼主為自然人者，以成年人為限。未成年人飼養動物者，以其法定代理人或監護人為飼主。',
    intro: '飼主對於其管領之動物，應依下列規定辦理：',
    items: [
      '一、 提供適當、乾淨且無害之食物及二十四小時充足、乾淨之飲水。',
      '二、 提供安全、乾淨、通風、排水、適當及適量之遮蔽、照明與溫度之生活環境。',
      '三、 提供法定動物傳染病之必要防治。',
      '四、 避免其遭受騷擾、虐待或傷害。',
      '五、 以籠子飼養寵物者，其籠內空間應足供寵物充分伸展，並應提供充分之籠外活動時間。',
    ],
    tail: '飼主飼養之動物，除得交送動物收容處所或直轄市、縣（市）主管機關指定之場所收容處理外，不得棄養。',
  },
  {
    no: '第 30 條',
    lead: '有下列情事之一者，處新臺幣三千元以上一萬五千元以下罰鍰，並得限期令其改善；屆期未改善者，得按次處罰之：',
    intro: '飼主對於其管領之動物，應依下列規定辦理：',
    items: [
      '一、 違反第五條第二項規定，未提供動物適當、乾淨且無害之食物及二十四小時充足、乾淨之飲水，或未提供安全、乾淨、通風、排水、適當及適量之遮蔽、照明與溫度之生活環境。',
      '二、 違反第五條第三項規定，棄養動物。',
    ],
    tail: '飼主飼養之動物，除得交送動物收容處所或直轄市、縣（市）主管機關指定之場所收容處理外，不得棄養。',
  },
]

const STREET_VIEW_YEARS = ['2023', '2024', '2025']
const PHOTOS = ['照片 1', '照片 2', '照片 3']

/* ── 小元件 ── */

function Divider() {
  return <div className="h-px w-full shrink-0 bg-neutral-200" />
}

/** 左欄 label/value 一行；value 對齊在 118px（照 Figma 的 48/76 gap 換算） */
function InfoRow({ label, value, right }) {
  return (
    <div className="flex w-full shrink-0 items-center justify-between">
      <div className="flex items-center text-sm leading-5 font-medium">
        <span className="w-[118px] shrink-0 text-neutral-500">{label}</span>
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

function FieldLabel({ children }) {
  return <p className="w-full shrink-0 text-sm leading-5 font-bold text-black">{children}</p>
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

function PhotoThumb({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-[69px] flex-1 flex-col justify-end overflow-hidden rounded-sm"
    >
      <Placeholder label="" tone="photo" className="absolute inset-0" />
      <div className="relative flex w-full items-center bg-[rgba(0,0,0,0.55)] px-1.5 py-[3px]">
        <span className="text-xs leading-[18px] font-medium text-white">{label}</span>
        <span className="h-1 flex-1" />
        <Maximize2 className="size-[11px] text-white" />
      </div>
    </button>
  )
}

/** 街景圖示意（不引外部圖片：CSS 色塊 + 白色路網） */
function StreetMap({ destination }) {
  return (
    <div className="relative h-[441px] w-full shrink-0 overflow-hidden rounded-lg border border-neutral-300 bg-[#e7ecef]">
      <div className="absolute left-[4%] top-[9%] h-[24%] w-[23%] rounded-sm bg-[#d8e8d4]" />
      <div className="absolute left-[28%] top-[9%] h-[24%] w-[24%] rounded-sm bg-[#d8e8d4]" />
      <div className="absolute left-[4%] top-[35%] h-[31%] w-[23%] rounded-sm bg-[#d8e8d4]" />
      <div className="absolute left-[28%] top-[35%] h-[31%] w-[24%] rounded-sm bg-[#d8e8d4]" />

      <div className="absolute left-0 top-[33%] h-[2%] w-full bg-white/70" />
      <div className="absolute left-0 top-[67%] h-[5%] w-full bg-white/95" />
      <div className="absolute left-0 bottom-[6%] h-[2%] w-full bg-white/70" />
      <div className="absolute left-[27%] top-0 h-full w-[1.4%] bg-white/60" />
      <div className="absolute left-[67%] top-0 h-full w-[3%] bg-white/95" />

      <div className="absolute left-[65%] top-[62%] flex size-[52px] items-center justify-center rounded-full bg-field-600/25">
        <div className="flex size-8 items-center justify-center rounded-full bg-field-600">
          <div className="size-3 rounded-full bg-white" />
        </div>
      </div>

      <div className="absolute left-[47%] top-[40%] flex h-[66px] items-center rounded-md bg-white px-7 shadow-md">
        <span className="text-xl leading-[30px] font-medium whitespace-nowrap text-neutral-700">
          目的地 · {destination}
        </span>
      </div>
    </div>
  )
}

export default function F2CasePreview() {
  const { state } = useApp()
  const c = state.activeCase

  const [reporterOpen, setReporterOpen] = useState(false)
  const caseType = '不當飼養' // 唯讀：案件類型由 1959 派案決定，外勤端不可改
  const [historyOpen, setHistoryOpen] = useState(false)

  const [streetView, setStreetView] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(null)
  const [refCases, setRefCases] = useState(false)
  const [lawModal, setLawModal] = useState(false)

  const caseTitle = c.title ?? CASE_TITLE

  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      {/* ── Top navigation / Field workspace ── */}
      <div className="flex h-[72px] shrink-0 items-center justify-between bg-field-900 pl-5 pr-9">
        <button
          type="button"
          onClick={() => navigate('f1')}
          className="flex size-12 items-center justify-center rounded-lg border-2 border-field-700 text-white"
          aria-label="返回"
        >
          <ChevronLeft className="size-6" />
        </button>
        <button
          type="button"
          onClick={() => navigate('f3')}
          className="flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-sm leading-5 font-bold text-field-700 shadow-xs"
        >
          出勤開始
        </button>
      </div>

      {/* ── Workspace row ── */}
      <div className="flex min-h-0 flex-1 justify-center gap-4 px-3 py-4">
        {/* ── 左：案件內容 ── */}
        <div className="scroll-thin flex w-[475px] flex-col gap-3 overflow-y-auto rounded-md border border-field-100 bg-field-50 px-6 py-5">
          <div className="flex w-full shrink-0 flex-col items-start py-[5px]">
            <span className="inline-flex h-7 items-center gap-[5px] rounded-full bg-danger pl-2.5 pr-3.5 text-white">
              <span className="text-xs font-bold">!</span>
              <span className="text-[13px] font-medium">緊急</span>
            </span>
            <p className="mt-1 text-xl leading-[30px] font-bold text-field-900">{caseTitle}</p>
          </div>

          <Divider />

          <InfoRow label="報案時間：" value={c.reportedAt} />

          <InfoRow
            label="地址："
            value={c.address}
            right={
              <button
                type="button"
                onClick={() => setStreetView(true)}
                className="flex size-6 items-center justify-center text-field-700"
                aria-label="查看街景圖"
              >
                <Map className="size-6" />
              </button>
            }
          />

          <div className="flex w-full shrink-0 items-center justify-between">
            <span className="text-sm leading-5 font-medium text-neutral-500">報案人：</span>
            <button
              type="button"
              onClick={() => setReporterOpen((v) => !v)}
              className="flex size-6 items-center justify-center text-neutral-700"
              aria-label="展開報案人資訊"
            >
              {reporterOpen ? <ChevronUp className="size-6" /> : <ChevronDown className="size-6" />}
            </button>
          </div>

          {/* F2-3-1 報案人資訊展開 */}
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
                  <span className="text-neutral-900">1959 平台</span>
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
          <div className="flex w-full shrink-0 items-center py-2.5">
            <p className="flex-1 text-sm leading-5 text-neutral-800">{c.description}</p>
          </div>

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
          <div className="flex w-full shrink-0 items-center py-2.5">
            <p className="flex-1 text-sm leading-5 text-neutral-800">{CASE_SUMMARY}</p>
          </div>

          <Divider />

          <SectionTitle>附圖：</SectionTitle>
          <div className="flex w-full shrink-0 flex-col gap-[7px] rounded-md border border-neutral-200 bg-neutral-50 p-2.5">
            <div className="flex h-5 w-full items-center justify-between">
              <span className="flex-1 text-sm leading-5 font-bold text-neutral-700">原始附件</span>
              <button
                type="button"
                onClick={() => setPhotoIndex(0)}
                className="text-xs leading-[18px] font-medium text-field-700"
              >
                3 份・點擊查看
              </button>
            </div>
            <div className="flex h-[69px] w-full items-start gap-1.5">
              {PHOTOS.map((label, i) => (
                <PhotoThumb key={label} label={label} onClick={() => setPhotoIndex(i)} />
              ))}
            </div>
          </div>
        </div>

        {/* ── 右：案件詳細資訊 ── */}
        <div className="scroll-thin flex w-[679px] flex-col gap-3 overflow-y-auto rounded-md border border-neutral-200 bg-white px-6 py-5">
          {/* 案件類型是 1959 派案時就決定的，外勤端唯讀（原本是可改的 select，2026-08-11 移除） */}
          <FieldLabel>案件類型：</FieldLabel>
          <div className="flex h-[52px] w-full shrink-0 items-center rounded-md border border-neutral-200 bg-neutral-50 px-3.5 py-2.5">
            <span className="text-base leading-6 font-medium text-neutral-900">{caseType}</span>
          </div>

          <FieldLabel>器具準備：</FieldLabel>
          <div className="flex w-full shrink-0 items-center rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 shadow-xs">
            <p className="flex-1 text-sm leading-5 whitespace-pre-line text-neutral-900">
              {EQUIPMENT}
            </p>
          </div>

          <FieldLabel>蒐證重點提醒：</FieldLabel>
          <div className="flex w-full shrink-0 items-center rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 shadow-xs">
            <ul className="flex flex-1 list-disc flex-col gap-5 ps-[21px] text-sm leading-5 text-neutral-900">
              {EVIDENCE_POINTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>

          <FieldLabel>過往案例提示</FieldLabel>
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
            onClick={() => setRefCases(true)}
            trailing={<MoreHorizontal className="size-6 text-neutral-700" />}
          >
            可參考案例<span className="text-field-600">（{REF_CASES.length}）</span>
          </SelectRow>

          <FieldLabel>※ 相關法律內容：</FieldLabel>
          <SelectRow
            onClick={() => setLawModal(true)}
            trailing={<MoreHorizontal className="size-6 text-neutral-700" />}
          >
            相關條文說明
          </SelectRow>

          <FieldLabel>其他：</FieldLabel>
          <div className="flex w-full shrink-0 items-center rounded-md bg-neutral-100 px-3 py-2.5">
            <p className="flex-1 text-sm leading-5 text-neutral-900">{REMARK}</p>
          </div>
        </div>
      </div>

      {/* ── F2-2 地址：街景圖 ── */}
      <Modal open={streetView} onClose={() => setStreetView(false)} width={919}>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-3">
            <div className="flex w-full items-center justify-between">
              <p className="text-2xl leading-8 font-bold text-neutral-900">街景圖</p>
              <button
                type="button"
                onClick={() => setStreetView(false)}
                className="text-neutral-900"
                aria-label="關閉"
              >
                <X className="size-6" />
              </button>
            </div>
            <p className="text-sm leading-5 font-medium text-neutral-500">{c.address}</p>
          </div>
          <Divider />
          <div className="flex items-center gap-4">
            <span className="text-xl leading-[30px] whitespace-nowrap text-neutral-900">
              查看年份
            </span>
            {STREET_VIEW_YEARS.map((y) => (
              <span
                key={y}
                className={`flex h-[26px] items-center justify-center rounded-[13px] border px-3 text-sm leading-5 font-medium ${
                  y === '2025'
                    ? 'border-field-200 bg-field-50 text-field-600'
                    : 'border-neutral-200 bg-neutral-100 text-neutral-500'
                }`}
              >
                {y}
              </span>
            ))}
          </div>
          <Divider />
          <StreetMap destination={c.address.replace(/^.{3}.{3}/, '')} />
        </div>
      </Modal>

      {/* ── F2-4 附圖預覽 ── */}
      <Modal open={photoIndex !== null} onClose={() => setPhotoIndex(null)} width={900}>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex w-full items-center justify-between">
            <p className="text-xl leading-[30px] font-bold text-neutral-900">附圖</p>
            <button
              type="button"
              onClick={() => setPhotoIndex(null)}
              className="text-neutral-900"
              aria-label="關閉"
            >
              <X className="size-6" />
            </button>
          </div>
          <Placeholder
            label={PHOTOS[photoIndex ?? 0]}
            tone="photo"
            className="aspect-[619/345] w-full rounded-md text-sm"
          />
          <div className="flex w-full items-center justify-between border-t border-neutral-200 px-4 py-3">
            <button
              type="button"
              onClick={() => setPhotoIndex((i) => (i > 0 ? i - 1 : PHOTOS.length - 1))}
              className="flex items-center justify-center rounded-md border border-neutral-300 bg-white p-2 shadow-xs"
              aria-label="上一張"
            >
              <ArrowLeft className="size-5 text-neutral-700" />
            </button>
            <span className="text-sm leading-5 font-medium text-neutral-700">
              第 {(photoIndex ?? 0) + 1} 頁，共 {PHOTOS.length} 頁
            </span>
            <button
              type="button"
              onClick={() => setPhotoIndex((i) => (i < PHOTOS.length - 1 ? i + 1 : 0))}
              className="flex items-center justify-center rounded-md border border-neutral-300 bg-white p-2 shadow-xs"
              aria-label="下一張"
            >
              <ArrowRight className="size-5 text-neutral-700" />
            </button>
          </div>
        </div>
      </Modal>

      {/* ── F2-5 可參考案例視窗 ── */}
      <Modal open={refCases} onClose={() => setRefCases(false)} width={869}>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex w-full items-start justify-between">
            <div className="flex items-start gap-3">
              <MoreHorizontal className="size-[31px] text-neutral-900" />
              <p className="text-2xl leading-8 font-bold text-neutral-900">可參考案例</p>
            </div>
            <button
              type="button"
              onClick={() => setRefCases(false)}
              className="text-neutral-900"
              aria-label="關閉"
            >
              <X className="size-6" />
            </button>
          </div>
          <div className="flex w-full flex-col gap-4">
            {REF_CASES.map((r) => (
              <div
                key={r.title}
                className="flex w-full flex-col gap-4 rounded-md bg-neutral-100 px-3 py-2.5"
              >
                <div className="flex w-full items-center justify-between">
                  <p className="text-base leading-6 font-bold text-black">{r.title}</p>
                  {r.tag && (
                    <span className="flex items-center justify-center rounded-2xl bg-danger-bg pl-2 pr-2.5 py-0.5 text-sm leading-5 font-medium text-danger">
                      {r.tag}
                    </span>
                  )}
                </div>
                <p className="w-full text-sm leading-5 text-black">{r.body}</p>
                <p className="w-full text-xs leading-[18px] text-neutral-600">{r.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── F2-6 動保條文說明視窗 ── */}
      <Modal open={lawModal} onClose={() => setLawModal(false)} width={869}>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex w-full items-start justify-between">
            <div className="flex items-start gap-3">
              <MoreHorizontal className="size-[31px] text-neutral-900" />
              <p className="text-2xl leading-8 font-bold text-neutral-900">動物保護法相關條文說明</p>
            </div>
            <button
              type="button"
              onClick={() => setLawModal(false)}
              className="text-neutral-900"
              aria-label="關閉"
            >
              <X className="size-6" />
            </button>
          </div>
          {LAW_ARTICLES.map((a) => (
            <div
              key={a.no}
              className="flex w-full flex-col gap-4 rounded-md bg-neutral-100 px-3 py-2.5"
            >
              <p className="text-base leading-6 font-bold text-black">{a.no}</p>
              <p className="w-full text-sm leading-5 font-bold text-black">{a.lead}</p>
              <div className="flex w-full flex-col gap-3.5 text-sm leading-5 text-black">
                <p>{a.intro}</p>
                <p className="whitespace-pre-line">{a.items.join('\n')}</p>
                <p>{a.tail}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
