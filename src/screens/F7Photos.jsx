import { useEffect, useMemo, useRef, useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { AiBadge } from '../components/ui.jsx'
import {
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Images,
  MapPin,
  Plus,
  Sparkles,
  Trash,
  X,
} from '../components/icons.jsx'

/*
  F7 瀏覽案件照片 — Figma page 10904:2467（13042×5125，get_metadata 會爆，
  改用 use_figma 唯讀腳本列 frame 再逐個 get_design_context）
    F7-1   瀏覽案件照片 /(可由拍攝或相簿新增照片) (10932:6019) → view 'grid'
    F7-1-1 內容收縮                              (10957:3138) → 分組標題 chevron 收合
    F7-2   點擊選取                              (11916:7312) → selectMode，未選任何張
    F7-3   選取照片後可點擊新增標籤               (11921:9735 / 11921:9877) → selectMode + 已選取
    F7-3-1 / F7-3-2 新增標籤 / 新增自訂標籤       (12002:1197 / 12002:1343) → <TagPicker> + custom
    F7-4 / F7-4-1 新增自訂標籤                    (12108:19039 / 12108:19311) → 同上（刪除後狀態）
    F7-5   照片標籤 詳情頁                        (12068:2241 / 12044:3332) → view 'detail'
    F7-5-1 / F7-5-2 詳情頁 / 自行新增             (12078:4717 / 12078:4932) → 詳情頁的 <TagPicker>
    F7-6   標籤放置                              (12052:1450) → 點照片任意位置放定位標籤
    F7-7   標籤刪除（點選／刪除）                  (12078:5147 / 12078:5273) → 標籤上的 x
    照片來源 menu                                (11527:5315) → 新增照片卡的下拉
    AI命名 / 標籤 / 標籤_pin / 分組標題 component set → 下面的小元件
  子畫面全部在本檔用 useState 切換，不另開路由。

  ⚠️ Figma 稿面是舊案（貓·Burder／台北市），一律改成 state.activeCase（米克斯犬／新北市板橋區）。
  ⚠️ 照片一律 <Placeholder> 風格的漸層 + inline SVG 自繪，不引 Figma asset URL（7 天過期）。
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
const CheckSquare = (p) => (
  <Svg {...p}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </Svg>
)
const PlusCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </Svg>
)
const MessageSquare = (p) => (
  <Svg {...p}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </Svg>
)

/* ── 標籤分類（Figma「標籤」component set 的 4 個 variant ＋ 未分類） ── */
const TAG_GROUPS = [
  { key: '動物身份', dot: 'bg-blue-500' },
  { key: '健康狀況', dot: 'bg-red-500' },
  { key: '環境', dot: 'bg-yellow-500' },
  { key: '照護狀態', dot: 'bg-green-500' },
]
const DOT_BY_GROUP = {
  動物身份: 'bg-blue-500',
  健康狀況: 'bg-red-500',
  環境: 'bg-yellow-500',
  照護狀態: 'bg-green-500',
  未分類: 'bg-neutral-400',
}

/* 標籤庫（Figma 是貓案，這裡換成本案的米克斯犬情境） */
const TAG_LIBRARY = {
  動物身份: ['犬·米克斯', '成犬·公', '無頸圈'],
  健康狀況: ['毛髮局部脫落', '精神萎靡', '體態偏瘦'],
  環境: ['陽台鐵籠', '排泄物堆積', '通風不良'],
  照護狀態: ['飲水不足', '飼料未補充', '未定期清理'],
}

/* AI 命名：依照片分類自動建議的分類標籤組合（★AI） */
const AI_NAME_BY_CATEGORY = {
  動物照片: '動物身份·健康狀況·照護狀態',
  環境照片: '環境·照護狀態·健康狀況',
}

const CATEGORIES = ['動物照片', '環境照片']

let seq = 0
const uid = (p) => `${p}-${Date.now()}-${(seq += 1)}`

/* ── 預設假資料：state.photos 為空時補 7 張 ──
   checklistId 刻意留 null，避免一進 F7 就把 F3 的 checklist 全部打勾。 */
const SEED_PHOTOS = [
  {
    category: '動物照片',
    label: '犬隻全身外觀',
    tags: [
      { label: '犬·米克斯', group: '動物身份' },
      { label: '毛髮局部脫落', group: '健康狀況' },
    ],
  },
  {
    category: '動物照片',
    label: '犬隻面部特寫',
    tags: [{ label: '動物身份', group: '動物身份' }],
  },
  {
    category: '動物照片',
    label: '犬隻活動力紀錄',
    tags: [
      { label: '精神萎靡', group: '健康狀況' },
      { label: '未分類', group: '未分類' },
    ],
  },
  {
    category: '環境照片',
    label: '陽台鐵籠全景',
    tags: [{ label: '陽台鐵籠', group: '環境' }],
  },
  {
    category: '環境照片',
    label: '地面排泄物堆積',
    tags: [
      { label: '排泄物堆積', group: '環境' },
      { label: '未定期清理', group: '照護狀態' },
    ],
  },
  {
    category: '環境照片',
    label: '飲水與飼料供給',
    tags: [{ label: '飲水不足', group: '照護狀態' }],
  },
  {
    category: '環境照片',
    label: '通風與遮蔽狀況',
    tags: [{ label: '通風不良', group: '環境' }],
  },
]

export default function F7Photos() {
  const { state, dispatch } = useApp()
  const c = state.activeCase

  /* 一進頁面若沒有任何照片就補預設假資料 */
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || state.photos.length > 0) return
    seeded.current = true
    SEED_PHOTOS.forEach((p, i) => {
      dispatch({
        type: 'ADD_PHOTO',
        payload: {
          id: `photo-seed-${i}`,
          category: p.category,
          label: p.label,
          checklistId: null,
          tags: p.tags.map((t, j) => ({ id: `tag-seed-${i}-${j}`, ...t, x: null, y: null })),
        },
      })
    })
  }, [state.photos.length, dispatch])

  /* 檢視狀態 */
  const [view, setView] = useState('grid') // grid | detail
  const [detailId, setDetailId] = useState(null)

  /* F7-2／F7-3 選取模式 */
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)

  /* 分組收合（F7-1-1 內容收縮）與照片來源 menu */
  const [collapsed, setCollapsed] = useState({})
  const [sourceMenu, setSourceMenu] = useState(null) // category | null

  const groups = useMemo(
    () =>
      CATEGORIES.map((name) => ({
        name,
        items: state.photos.filter((p) => (p.category ?? '動物照片') === name),
      })),
    [state.photos],
  )

  const detail = state.photos.find((p) => p.id === detailId) ?? null

  /* ── 動作 ── */
  const toggleSelect = (id) =>
    setSelected((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))

  const exitSelect = () => {
    setSelectMode(false)
    setSelected([])
    setPickerOpen(false)
  }

  const removeSelected = () => {
    selected.forEach((id) => dispatch({ type: 'REMOVE_PHOTO', id }))
    setSelected([])
  }

  /** 把標籤套用到目前選取的每一張照片（F7-3 套用到 N 張照片） */
  const applyTagToSelected = (tag) => {
    selected.forEach((id) => {
      const photo = state.photos.find((p) => p.id === id)
      if (!photo) return
      if (photo.tags.some((t) => t.label === tag.label && t.x == null)) return
      dispatch({
        type: 'TAG_PHOTO',
        id,
        tags: [...photo.tags, { id: uid('tag'), ...tag, x: null, y: null }],
      })
    })
  }

  const addPhotoFromAlbum = (category) => {
    dispatch({
      type: 'ADD_PHOTO',
      payload: {
        id: uid('photo'),
        category,
        label: `${category === '環境照片' ? '環境' : '動物'}補充照片`,
        checklistId: null,
        tags: [],
      },
    })
    setSourceMenu(null)
  }

  /* ── F7-5 照片標籤詳情頁 ── */
  if (view === 'detail' && detail) {
    return (
      <PhotoDetail
        photo={detail}
        onClose={() => {
          setView('grid')
          setDetailId(null)
        }}
        onTags={(tags) => dispatch({ type: 'TAG_PHOTO', id: detail.id, tags })}
        recording={state.recording}
        dispatch={dispatch}
      />
    )
  }

  /* ── F7-1 主畫面 ── */
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-canvas">
      {/* ── 頂欄 Top navigation / Field workspace ── */}
      <header className="flex h-[72px] shrink-0 items-center justify-between bg-field-900 pr-9 pl-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('f3')}
            className="flex size-12 items-center justify-center rounded-lg border-2 border-field-700 text-white"
            aria-label="返回工作台"
          >
            <ChevronLeft className="size-6" />
          </button>
          <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-white">
            瀏覽案件照片
          </p>
          <span className="flex items-center rounded-full bg-field-50 px-2.5 py-1.5 text-xs leading-[18px] font-bold text-field-700">
            {c.animal.count} 隻動物已掃描
          </span>
        </div>
        <span className="text-xs leading-[18px] font-medium text-field-200">
          共 {state.photos.length} 張・案件 {c.id}
        </span>
      </header>

      {/* ── Workspace body ── */}
      <div className="flex min-h-0 flex-1 p-4">
        <section className="flex min-h-0 w-full flex-col overflow-hidden rounded-md bg-white">
          <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-2.5 pb-6">
            {/* 提示條 */}
            <div className="flex shrink-0 items-center gap-2 rounded-md border border-field-200 bg-field-50 px-4 py-5">
              <MessageSquare className="size-[17px] shrink-0 text-field-600" />
              <p className="flex-1 text-base leading-6 text-field-600">
                提示：點擊照片可查看詳細資訊，點擊選取後可選擇多張照片。
              </p>
            </div>

            {/* 工具列（F7-1 → F7-2 → F7-3） */}
            <div className="relative flex shrink-0 items-center gap-3">
              {!selectMode ? (
                <button
                  onClick={() => setSelectMode(true)}
                  className="flex h-12 items-center justify-center gap-2.5 rounded-md bg-field-600 px-3 py-1 text-lg leading-7 font-bold text-white"
                >
                  <CheckSquare className="size-6" />
                  選取
                </button>
              ) : (
                <>
                  <button
                    onClick={exitSelect}
                    className="flex h-12 items-center justify-center gap-2.5 rounded-md bg-field-600 px-3 py-1 text-lg leading-7 font-bold text-white"
                  >
                    <Images className="size-6" />
                    完成
                  </button>
                  <button
                    disabled={selected.length === 0}
                    onClick={() => setPickerOpen((v) => !v)}
                    className={`flex h-12 items-center justify-center gap-2.5 rounded-md px-3 py-1 text-lg leading-7 font-bold ${
                      selected.length === 0
                        ? 'bg-neutral-100 text-neutral-400'
                        : 'bg-field-800 text-white'
                    }`}
                  >
                    <Plus className="size-6" />
                    新增標籤
                  </button>
                  <button
                    disabled={selected.length === 0}
                    onClick={removeSelected}
                    className={`flex h-12 items-center justify-center gap-2.5 rounded-md border bg-white px-3 py-1 text-lg leading-7 font-bold ${
                      selected.length === 0
                        ? 'border-neutral-200 text-neutral-300'
                        : 'border-danger text-danger'
                    }`}
                  >
                    <Trash className="size-6" />
                    刪除照片
                  </button>
                  <span className="text-sm leading-5 font-medium text-neutral-700">
                    已選取 {selected.length} 張
                  </span>
                </>
              )}

              {/* F7-3-1 新增標籤面板 */}
              {pickerOpen && selected.length > 0 && (
                <div className="absolute top-[56px] left-[100px] z-30">
                  <TagPicker
                    headline={`套用到 ${selected.length} 張照片`}
                    onDone={() => setPickerOpen(false)}
                    onPick={applyTagToSelected}
                  />
                </div>
              )}
            </div>

            <div className="h-px w-full shrink-0 bg-neutral-200" />

            {/* 分組：動物照片／環境照片 */}
            {groups.map((g, gi) => {
              const open = !collapsed[g.name]
              return (
                <div key={g.name} className="flex shrink-0 flex-col gap-4">
                  {gi > 0 && <div className="h-px w-full bg-neutral-200" />}
                  {/* 分組標題 component */}
                  <div className="flex w-full items-center justify-between pl-2.5">
                    <p className="text-lg leading-7 font-bold text-neutral-900">{g.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-7 font-medium text-neutral-500">
                        ({g.items.length})
                      </span>
                      <button
                        onClick={() => setCollapsed((v) => ({ ...v, [g.name]: open }))}
                        className="flex size-10 items-center justify-center text-neutral-700"
                        aria-label={open ? '收合' : '展開'}
                      >
                        {open ? <ChevronUp className="size-6" /> : <ChevronDown className="size-6" />}
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="flex flex-wrap items-start gap-6 rounded-md px-3 py-2.5">
                      {g.items.map((p) => (
                        <PhotoCard
                          key={p.id}
                          photo={p}
                          selectMode={selectMode}
                          selected={selected.includes(p.id)}
                          onClick={() => {
                            if (selectMode) return toggleSelect(p.id)
                            setDetailId(p.id)
                            setView('detail')
                          }}
                        />
                      ))}

                      {/* 新增照片卡 ＋ 照片來源 menu */}
                      <div className="relative">
                        <button
                          onClick={() => setSourceMenu(sourceMenu === g.name ? null : g.name)}
                          className="flex h-[196px] w-[236px] flex-col items-center justify-center gap-2 rounded-xl border border-field-200 bg-field-50"
                        >
                          <PlusCircle className="size-[34px] text-field-600" />
                          <span className="text-xs leading-[18px] font-bold text-field-700">
                            新增照片
                          </span>
                        </button>

                        {sourceMenu === g.name && (
                          <div className="absolute top-[102px] left-[196px] z-30 flex w-[193px] flex-col rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
                            <button
                              onClick={() => navigate('f10')}
                              className="flex items-center px-4 hover:bg-neutral-50"
                            >
                              <Camera className="size-6 shrink-0 text-neutral-600" />
                              <span className="flex-1 px-3.5 py-2.5 text-left text-base leading-6 font-medium text-neutral-600">
                                開啟相機拍攝
                              </span>
                            </button>
                            <button
                              onClick={() => addPhotoFromAlbum(g.name)}
                              className="flex items-center px-4 hover:bg-neutral-50"
                            >
                              <Images className="size-6 shrink-0 text-neutral-600" />
                              <span className="flex-1 px-3.5 py-2.5 text-left text-base leading-6 font-medium text-neutral-600">
                                由本機相簿選取
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <RecordingBar recording={state.recording} dispatch={dispatch} />
    </div>
  )
}

/* ───────────────────────── 照片卡 ───────────────────────── */

function PhotoCard({ photo, selectMode, selected, onClick }) {
  const tags = photo.tags ?? []
  const shown = tags.slice(0, 3)

  return (
    <button
      onClick={onClick}
      className={`flex w-[236px] flex-col items-start overflow-hidden rounded-xl bg-white text-left ${
        selected ? 'border-2 border-field-300' : 'border border-neutral-200'
      }`}
    >
      <div className="relative h-[150px] w-full overflow-hidden">
        <PhotoArt label={photo.label} category={photo.category} />
        {/* 定位標籤的小圓點 */}
        {tags
          .filter((t) => t.x != null)
          .map((t) => (
            <span
              key={t.id}
              className={`absolute size-2.5 rounded-full border border-white ${DOT_BY_GROUP[t.group] ?? 'bg-neutral-400'}`}
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
            />
          ))}
        {selectMode && (
          <span
            className={`absolute top-3 right-3 flex size-5 items-center justify-center rounded-sm border ${
              selected ? 'border-field-600 bg-field-50' : 'border-neutral-300 bg-white'
            }`}
          >
            {selected && <Check className="size-3.5 text-field-600" />}
          </span>
        )}
      </div>

      <div className="flex w-full flex-col gap-1.5 px-3 pt-2.5 pb-3">
        <div className="flex flex-wrap items-start gap-1.5">
          {shown.map((t) => (
            <TagPill key={t.id} tag={t} />
          ))}
          {tags.length > shown.length && (
            <span className="flex h-6 items-center rounded-full border border-neutral-200 bg-white px-2 text-xs leading-[18px] text-neutral-500">
              +{tags.length - shown.length}
            </span>
          )}
          {tags.length === 0 && (
            <span className="flex h-6 items-center rounded-full border border-dashed border-neutral-300 bg-white px-2 text-xs leading-[18px] text-neutral-400">
              尚未加標籤
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/** 標籤 pill（Figma「標籤」component：8px 圓點 + 12px 文字 + 可選的刪除 x） */
function TagPill({ tag, onRemove, full }) {
  return (
    <span
      className={`flex h-6 items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-2 py-1 ${
        full ? 'w-full' : ''
      }`}
    >
      <span className={`size-2 shrink-0 rounded-full ${DOT_BY_GROUP[tag.group] ?? 'bg-neutral-400'}`} />
      <span className="min-w-0 flex-1 truncate text-xs leading-[18px] text-neutral-700">
        {tag.label}
      </span>
      {onRemove && (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="flex size-4 shrink-0 items-center justify-center rounded-full bg-danger text-white"
          aria-label="刪除標籤"
        >
          <X className="size-2.5" />
        </span>
      )}
    </span>
  )
}

/* ───────────────────────── 標籤選擇面板 ───────────────────────── */

function TagPicker({ headline, onDone, onPick, onClose }) {
  const [draft, setDraft] = useState('')
  const [customOpen, setCustomOpen] = useState(false)
  const [customGroup, setCustomGroup] = useState('未分類')

  const commit = () => {
    const label = draft.trim()
    if (!label) return
    onPick({ label, group: customOpen ? customGroup : '未分類' })
    setDraft('')
    setCustomOpen(false)
  }

  return (
    <div className="scroll-thin flex max-h-[420px] w-[320px] flex-col gap-3 overflow-y-auto rounded-[14px] border border-neutral-200 bg-white px-4 pt-4 pb-3.5 shadow-lg">
      {/* F7-3-1 選取模式才有「套用到 N 張照片」表頭；F7-5 詳情頁的面板直接從輸入框開始 */}
      {headline && (
        <div className="flex shrink-0 items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-field-50 px-2.5 py-1.5 text-xs leading-[18px] font-bold text-field-700">
            <CheckSquare className="size-4" />
            {headline}
          </span>
          <button
            onClick={onDone}
            className="flex h-8 items-center justify-center rounded-md bg-field-600 px-3 text-sm leading-5 font-bold text-white"
          >
            完成
          </button>
        </div>
      )}

      {/* 輸入框 + 新增標籤 */}
      <div className="flex shrink-0 items-start gap-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder="輸入標籤名稱…"
          className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-field-600 bg-white px-3 py-[11px] text-sm leading-5 text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <button
          onClick={commit}
          disabled={!draft.trim()}
          className={`flex h-10 w-[90px] shrink-0 items-center justify-center rounded-md text-base leading-6 font-bold ${
            draft.trim() ? 'bg-field-600 text-white' : 'bg-neutral-200 text-neutral-400'
          }`}
        >
          新增標籤
        </button>
      </div>

      {/* AI 建議 */}
      <div className="flex shrink-0 items-center gap-2">
        <AiBadge>AI 建議</AiBadge>
        <span className="text-xs leading-[18px] font-medium text-ai-500">
          依案件與物種自動建議標籤
        </span>
      </div>

      {/* 分類與標籤 */}
      {TAG_GROUPS.map((g) => (
        <div key={g.key} className="flex shrink-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${g.dot}`} />
            <span className="text-sm leading-5 font-medium text-neutral-900">{g.key}</span>
          </div>
          {TAG_LIBRARY[g.key].map((label) => (
            <button
              key={label}
              onClick={() => onPick({ label, group: g.key })}
              className="flex h-6 w-full items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-2 py-1 text-left hover:border-field-600"
            >
              <span className={`size-2 shrink-0 rounded-full ${g.dot}`} />
              <span className="truncate text-xs leading-[18px] text-neutral-700">{label}</span>
            </button>
          ))}
        </div>
      ))}

      {/* F7-3-2 / F7-4 新增自訂標籤 */}
      {customOpen ? (
        <div className="flex shrink-0 flex-col gap-2 rounded-md border border-field-200 bg-field-50 p-2.5">
          <p className="text-xs leading-[18px] font-bold text-field-700">選擇自訂標籤的分類</p>
          <div className="flex flex-wrap gap-1.5">
            {[...TAG_GROUPS.map((g) => g.key), '未分類'].map((k) => (
              <button
                key={k}
                onClick={() => setCustomGroup(k)}
                className={`flex h-6 items-center gap-1.5 rounded-full border bg-white px-2 text-xs leading-[18px] ${
                  customGroup === k ? 'border-field-600 text-field-700' : 'border-neutral-200 text-neutral-700'
                }`}
              >
                <span className={`size-2 rounded-full ${DOT_BY_GROUP[k]}`} />
                {k}
              </button>
            ))}
          </div>
          <p className="text-xs leading-[18px] text-neutral-600">
            在上方輸入名稱後按「新增標籤」即可加入。
          </p>
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-between gap-2 pt-2 pl-1">
          <button
            onClick={() => setCustomOpen(true)}
            className="flex items-center gap-2 text-sm text-field-700"
          >
            <span className="font-bold">＋</span>
            <span className="font-medium">新增自訂標籤</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm leading-5 font-medium text-neutral-500"
            >
              取消
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── F7-5 照片標籤詳情頁 ───────────────────────── */

function PhotoDetail({ photo, onClose, onTags, recording, dispatch }) {
  const tags = photo.tags ?? []
  const pins = tags.filter((t) => t.x != null)
  const whole = tags.filter((t) => t.x == null)

  /* F7-6：點照片任意位置放定位標籤 */
  const [draftPin, setDraftPin] = useState(null) // {x,y}
  /* AI 命名 */
  const suggestion = AI_NAME_BY_CATEGORY[photo.category] ?? '動物身份·環境·照護狀態'
  const [aiName, setAiName] = useState(suggestion)
  const [aiEditing, setAiEditing] = useState(false)
  const [aiAdopted, setAiAdopted] = useState(false)

  const addTag = (tag, pos) =>
    onTags([...tags, { id: uid('tag'), ...tag, x: pos?.x ?? null, y: pos?.y ?? null }])

  const removeTag = (id) => onTags(tags.filter((t) => t.id !== id))

  const onPhotoClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setDraftPin({
      x: Math.round(((e.clientX - r.left) / r.width) * 100),
      y: Math.round(((e.clientY - r.top) / r.height) * 100),
    })
  }

  const adoptAi = () => {
    const parts = aiName
      .split(/[·・、,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const next = [...tags]
    parts.forEach((label) => {
      if (next.some((t) => t.label === label && t.x == null)) return
      next.push({
        id: uid('tag'),
        label,
        group: DOT_BY_GROUP[label] ? label : '未分類',
        x: null,
        y: null,
      })
    })
    onTags(next)
    setAiAdopted(true)
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-neutral-100">
      {/* 頂欄 */}
      <header className="flex h-[72px] shrink-0 items-center justify-between bg-field-900 pr-9 pl-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex size-12 items-center justify-center rounded-lg border-2 border-field-700 text-white"
            aria-label="返回照片清單"
          >
            <ChevronLeft className="size-6" />
          </button>
          <div className="flex flex-col gap-0.5">
            <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-white">照片標籤</p>
            <p className="text-xs leading-[18px] font-medium text-field-200">{photo.label}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-[38px] w-[68px] items-center justify-center rounded-md bg-white text-base leading-6 font-bold text-field-900"
        >
          完成
        </button>
      </header>

      {/* Workspace body */}
      <div className="flex min-h-0 flex-1 gap-4 p-4">
        {/* 左：照片 + 定位標籤 */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-md shadow-md">
          <button
            onClick={onPhotoClick}
            className="relative block h-full w-full cursor-crosshair"
            aria-label="點照片任意位置新增標籤"
          >
            <PhotoArt label={photo.label} category={photo.category} large />
          </button>

          {/* 引導提示 */}
          <div className="pointer-events-none absolute top-[19px] left-1/2 flex -translate-x-1/2 items-center justify-center rounded-md bg-field-50 px-3 py-2.5">
            <p className="text-sm leading-5 font-medium whitespace-nowrap text-field-600">
              點照片任意位置新增標籤
            </p>
          </div>

          {/* 已放置的定位標籤 */}
          {pins.map((t) => (
            <div
              key={t.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-full"
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
            >
              <span className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2 py-1 shadow-md">
                <span
                  className={`size-2 shrink-0 rounded-full ${DOT_BY_GROUP[t.group] ?? 'bg-neutral-400'}`}
                />
                <span className="text-xs leading-[18px] text-neutral-700">{t.label}</span>
                <span
                  role="button"
                  onClick={() => removeTag(t.id)}
                  className="flex size-4 items-center justify-center rounded-full bg-danger text-white"
                  aria-label="刪除標籤"
                >
                  <X className="size-2.5" />
                </span>
              </span>
              <span className="mx-auto block size-2 -translate-y-1 rotate-45 bg-white" />
            </div>
          ))}

          {/* F7-6 標籤放置：草稿 pin + 標籤選擇面板 */}
          {draftPin && (
            <>
              <span
                className="absolute z-10 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-field-600 shadow-md"
                style={{ left: `${draftPin.x}%`, top: `${draftPin.y}%` }}
              />
              {/* Figma F7-6：面板出現在 pin 的右側、上緣略高於 pin */}
              <div
                className="absolute z-20"
                style={{
                  left: `clamp(8px, calc(${draftPin.x}% + 20px), calc(100% - 336px))`,
                  top: `clamp(8px, calc(${draftPin.y}% - 30px), max(8px, calc(100% - 428px)))`,
                }}
              >
                <TagPicker
                  onClose={() => setDraftPin(null)}
                  onPick={(tag) => {
                    addTag(tag, draftPin)
                    setDraftPin(null)
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* 右：標籤清單 + AI 命名 */}
        <div className="scroll-thin flex w-[397px] shrink-0 flex-col gap-6 overflow-y-auto rounded-md bg-white p-4">
          <div className="flex w-full shrink-0 items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="size-6 text-neutral-800" />
              <p className="text-xl leading-[30px] font-bold text-neutral-800">照片上的位置</p>
            </div>
            <p className="text-lg leading-7 font-medium text-neutral-800">{pins.length}</p>
          </div>
          {pins.length > 0 && (
            <div className="flex shrink-0 flex-col gap-2">
              {pins.map((t) => (
                <TagPill key={t.id} tag={t} full onRemove={() => removeTag(t.id)} />
              ))}
            </div>
          )}

          <div className="h-px w-full shrink-0 bg-neutral-200" />

          <div className="flex shrink-0 flex-col gap-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Images className="size-6 text-neutral-800" />
                <p className="text-xl leading-[30px] font-bold text-neutral-800">整張照片</p>
              </div>
              <p className="text-lg leading-7 font-medium text-neutral-800">{whole.length}</p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {whole.map((t) => (
                <TagPill key={t.id} tag={t} full onRemove={() => removeTag(t.id)} />
              ))}
              {whole.length === 0 && (
                <p className="text-xs leading-[18px] text-neutral-400">
                  尚未加入整張照片的分類標籤。
                </p>
              )}
            </div>
          </div>

          {/* ★AI 命名（Figma「AI命名」component 12044:3782） */}
          <div className="flex shrink-0 flex-col gap-2.5 rounded-md border border-ai-200 bg-ai-50 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-ai-700" />
              <p className="flex-1 text-base leading-6 font-bold text-ai-700">AI 命名</p>
              <AiBadge />
            </div>
            <p className="text-xs leading-[18px] font-medium text-ai-500">
              AI 依照片內容自動建議的分類標籤，可直接採用或改成自己的說法。
            </p>

            {aiEditing ? (
              <input
                autoFocus
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
                onBlur={() => setAiEditing(false)}
                className="w-full rounded-md border border-field-600 bg-white px-3 py-2.5 text-sm leading-5 text-ai-700 outline-none"
              />
            ) : (
              <div className="flex h-12 w-full items-center rounded-md border border-neutral-200 bg-white px-3">
                <p className="truncate text-sm leading-5 font-medium text-ai-700">{aiName}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setAiEditing(true)}
                className="rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-sm leading-5 font-bold text-neutral-700 shadow-xs"
              >
                修改
              </button>
              <button
                onClick={adoptAi}
                className="rounded-md bg-field-600 px-3.5 py-2 text-sm leading-5 font-bold text-white shadow-xs"
              >
                {aiAdopted ? '已採用' : '採用'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <RecordingBar recording={recording} dispatch={dispatch} />
    </div>
  )
}

/* ───────────────────────── 共用小元件 ───────────────────────── */

/** 底部錄音列 Field recording bar（與 F3 同一套視覺；狀態走全域 state，不另存一份） */
function RecordingBar({ recording, dispatch }) {
  const status = recording?.status === 'done' ? 'idle' : (recording?.status ?? 'idle')
  const active = status === 'recording'
  const set = (s) => dispatch({ type: 'SET_RECORDING', payload: { status: s } })
  const WAVE = [10, 18, 28, 16, 34, 22, 12, 30, 20, 36, 16, 26, 12, 32, 18, 24, 14, 28, 10, 20, 34, 16, 22, 12]

  return (
    <footer className="flex h-20 shrink-0 items-center justify-between border-t border-neutral-200 bg-white px-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex items-center gap-[7px] rounded-full px-2.5 py-[7px] text-xs leading-[18px] font-bold ${
            active ? 'bg-field-50 text-field-700' : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          <span className={`size-2 rounded-full ${active ? 'bg-field-600' : 'bg-neutral-400'}`} />
          {active ? '錄音中' : status === 'paused' ? '已暫停' : '尚未錄音'}
        </span>
        <span className="text-sm leading-5 font-bold text-neutral-900">00:00:00</span>
      </div>

      <div className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1">
        {WAVE.map((h, i) => (
          <span
            key={i}
            className={`w-1 rounded-[2px] ${active ? 'bg-field-400' : 'bg-neutral-300'}`}
            style={{ height: active ? h : Math.max(6, h / 3) }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('f3')}
          className="flex h-12 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm leading-5 font-bold text-field-700 shadow-xs"
        >
          回工作台
        </button>
        {status === 'idle' ? (
          <button
            onClick={() => set('recording')}
            className="flex h-12 items-center justify-center gap-2 rounded-md border border-field-600 bg-field-600 px-6 text-sm leading-5 font-bold text-white shadow-xs"
          >
            開始錄音
          </button>
        ) : (
          <button
            onClick={() => set(active ? 'paused' : 'recording')}
            className="flex h-12 items-center justify-center gap-2 rounded-md border border-field-600 bg-field-600 px-6 text-sm leading-5 font-bold text-white shadow-xs"
          >
            {active ? '暫停錄音' : '繼續錄音'}
          </button>
        )}
      </div>
    </footer>
  )
}

/** 照片示意：漸層底 + inline SVG 剪影（不引外部圖片，離線 demo 也要能跑） */
function PhotoArt({ label, category, large = false }) {
  const env = category === '環境照片'
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
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
        viewBox="0 0 236 150"
        preserveAspectRatio="xMidYMid slice"
        style={{ filter: 'blur(4px)' }}
      >
        {env ? (
          <>
            <rect x="20" y="10" width="116" height="98" rx="6" fill="#5d6b68" opacity="0.32" />
            <path d="M20 10h116M20 34h116M20 58h116M20 82h116" stroke="#455250" strokeWidth="2" opacity="0.35" />
            <path d="M44 10v98M80 10v98M114 10v98" stroke="#455250" strokeWidth="2" opacity="0.35" />
            <rect x="0" y="108" width="236" height="42" fill="#6d7a77" opacity="0.45" />
            <ellipse cx="188" cy="116" rx="34" ry="16" fill="#4e5c59" opacity="0.4" />
            <ellipse cx="70" cy="132" rx="46" ry="18" fill="#3f4b49" opacity="0.3" />
          </>
        ) : (
          <>
            <rect x="0" y="0" width="236" height="34" fill="#c8c0b6" opacity="0.45" />
            <rect x="0" y="118" width="236" height="32" fill="#5f564d" opacity="0.35" />
            <ellipse cx="112" cy="108" rx="74" ry="34" fill="#6f6459" opacity="0.5" />
            <ellipse cx="158" cy="72" rx="30" ry="27" fill="#7d7165" opacity="0.55" />
            <ellipse cx="52" cy="96" rx="26" ry="20" fill="#7a6f63" opacity="0.4" />
          </>
        )}
      </svg>
      <span
        className={`relative rounded-full bg-black/35 px-2.5 py-1 font-medium text-white ${
          large ? 'text-sm leading-5' : 'text-xs leading-[18px]'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
