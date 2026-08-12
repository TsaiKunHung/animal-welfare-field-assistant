import { useMemo, useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import {
  CATEGORY_BY_GROUP,
  DOT_BY_GROUP,
  TAG_GROUPS,
  TAG_LIBRARY,
  guideFor,
  suggestedTags,
} from '../store/evidence.js'
import { AiBadge, PhotoArt } from '../components/ui.jsx'
import {
  Camera,
  Check,
  ChevronLeft,
  Grid,
  Image,
  MapPin,
  Plus,
  RotateCcw,
  Tag,
  X,
} from '../components/icons.jsx'

/*
  F10 拍攝介面 — Figma page 10904:2469
    F10-1   拍攝介面 拍攝前             (11432:5094) → view 'shoot'，左下角是空的相簿鈕
    F10-1-1 拍攝介面 拍攝後(左下圖標出現) (11432:5030) → view 'shoot' + shots.length > 0

  ★ 2026-08-11 改版：拍照不再是「按一下快門就打勾」，改成照著角度清單拍完再統一標籤。
    現場的實際流程是：一個蒐證項目底下有好幾個一定要拍到的角度（例如「拍攝動物全身與
    特徵」要拍全身／頭部／四肢／被毛），動檢員照著拍、每個角度可以拍多張，
    全部拍完按「完成」才進到標籤畫面，一次把這批照片標好 —— 標籤建議也跟著
    剛剛點的那個蒐證項目走。角度與標籤建議都定義在 store/evidence.js。

    view 'shoot'  取景畫面＋右側角度引導清單
    view 'review' 圖片標籤畫面（Figma F7-3 的標籤面板搬到這裡，針對「本次拍的這幾張」）

  ⚠️ Figma 稿面的取景畫面是一張實拍照（asset URL 七天過期、離線 demo 連不到），
     這裡改成 CSS 漸層 + inline SVG 自繪的失焦室內場景，再加對焦框與三分格線。
  ⚠️ Figma F10 兩個 frame 都沒有離開出口，右上角「完成」是補的（照 F7-5 的樣式）。
*/

const isPhotoItem = (label) => label.startsWith('拍攝')

let seq = 0
const uid = (p) => `${p}-${Date.now()}-${(seq += 1)}`

export default function F10Camera() {
  const { state, dispatch } = useApp()

  /* 要拍哪一項：F3 點相機時寫進 state.cameraTarget；直接開網址時退回第一個未完成的拍照項目 */
  const target = useMemo(() => {
    const byId = state.checklist.find((c) => c.id === state.cameraTarget)
    return byId ?? state.checklist.find((c) => !c.done && isPhotoItem(c.label)) ?? null
  }, [state.checklist, state.cameraTarget])

  const rawGuide = guideFor(target?.id)

  /*
    ── 拍攝提醒帶入寵物名字 ──
    F6 掃完晶片、從寵登網把資料帶回來之後，state.petRecord 就有這隻動物的名字。
    這時候拍攝引導不該再寫「拍攝動物全身側面」這種泛稱 —— 現場可能有好幾隻，
    寫成「拍攝 Burder 全身側面」動檢員才知道鏡頭要對誰。
    只有動物類的蒐證項目替換；環境類維持原文。
  */
  const subject = state.petRecord?.name ?? null
  const onAnimal = subject && target?.group === '動物狀況'
  /* 名字是英文時中英之間補一個空格：「Burder 全身側面」而不是「Burder全身側面」 */
  const named = (text) =>
    onAnimal ? text.replace(/動物/g, `${subject} `).replace(/ (?=[，。、；])/g, '') : text
  const guide = useMemo(
    () => ({
      ...rawGuide,
      shots: rawGuide.shots.map((sh) => ({ ...sh, label: named(sh.label), hint: named(sh.hint) })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawGuide, subject, onAnimal],
  )
  const targetLabel = onAnimal ? `拍攝 ${subject} 的外觀與特徵` : (target?.label ?? '自由補拍')

  const [view, setView] = useState('shoot')
  const [mode, setMode] = useState('photo')
  const [flash, setFlash] = useState(false)

  /* 目前對準第幾個角度 */
  const [shotIndex, setShotIndex] = useState(0)
  /* 本次拍到的照片（尚未寫進全域，按「完成」才一起送出） */
  const [shots, setShots] = useState([]) // { id, shotKey, shotLabel, tags: [] }

  const current = guide.shots[shotIndex] ?? null
  const countOf = (key) => shots.filter((s) => s.shotKey === key).length
  const remaining = guide.shots.filter((s) => countOf(s.key) === 0)

  const shutter = () => {
    if (!current) return
    setShots((v) => [
      ...v,
      { id: uid('photo'), shotKey: current.key, shotLabel: current.label, tags: [] },
    ])
    setFlash(true)
    setTimeout(() => setFlash(false), 160)
    /* 這個角度拍過了就自動跳到下一個還沒拍的，動檢員不用一直手動點 */
    const next = guide.shots.findIndex((s, i) => i > shotIndex && countOf(s.key) === 0)
    if (next >= 0) setShotIndex(next)
  }

  /* 拍完 → 進標籤畫面 */
  const finishShooting = () => {
    if (shots.length === 0) return navigate('f3')
    setView('review')
  }

  /* 標籤完成 → 一次寫進全域，回工作台 */
  const commit = () => {
    const category = CATEGORY_BY_GROUP[target?.group] ?? '動物照片'
    shots.forEach((s) => {
      dispatch({
        type: 'ADD_PHOTO',
        payload: {
          id: s.id,
          category,
          label: s.shotLabel,
          checklistId: target?.id ?? null,
          shot: s.shotKey,
          /* t 已經帶著 x/y（定位標籤）或 null（一般標籤），不要在這裡蓋掉 */
          tags: s.tags.map((t) => ({ id: uid('tag'), ...t })),
        },
      })
    })
    dispatch({ type: 'SET_CAMERA_TARGET', id: null })
    navigate('f3')
  }

  if (view === 'review') {
    return (
      <TagReview
        target={target}
        targetLabel={targetLabel}
        shots={shots}
        setShots={setShots}
        onBack={() => setView('shoot')}
        onDone={commit}
      />
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-black">
      <Viewfinder />
      {flash && <div className="absolute inset-0 z-40 bg-white/70" />}

      {/* ── 左上：標題＋正在拍哪一個蒐證項目 ── */}
      <div className="absolute top-6 left-8 z-20 flex items-start gap-2.5">
        <Camera className="mt-0.5 size-6 shrink-0 text-white" />
        <div className="flex flex-col">
          <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-white">照片拍攝</p>
          <p className="text-xs leading-[18px] font-medium text-field-200">
            {target ? `${target.group}｜${targetLabel}` : '自由補拍'}
          </p>
        </div>
      </div>

      {/* ── 右上：完成 ── */}
      <button
        onClick={finishShooting}
        className="absolute top-6 right-9 z-20 flex h-[38px] items-center justify-center rounded-md bg-white px-4 text-base leading-6 font-bold text-field-900"
      >
        完成
        {shots.length > 0 && `（${shots.length}）`}
      </button>

      {/* ── 右側：角度引導清單 ── */}
      <div className="absolute top-24 right-9 bottom-32 z-20 flex w-[268px] flex-col gap-2">
        <div className="flex items-center gap-2 rounded-md bg-field-900/70 px-3 py-2">
          <p className="flex-1 text-sm leading-5 font-bold text-white">
            {onAnimal ? `${subject} 需拍攝的角度` : '本項需拍攝的角度'}
          </p>
          <span className="text-xs leading-[18px] font-medium text-field-200">
            {guide.shots.length - remaining.length}／{guide.shots.length}
          </span>
        </div>

        <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
          {guide.shots.map((s, i) => {
            const n = countOf(s.key)
            const active = i === shotIndex
            return (
              <button
                key={s.key}
                onClick={() => setShotIndex(i)}
                className={`flex shrink-0 flex-col gap-0.5 rounded-md px-3 py-2 text-left ${
                  active ? 'bg-white' : 'bg-field-900/70 hover:bg-field-900/85'
                }`}
              >
                <span className="flex w-full items-center gap-2">
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      n > 0
                        ? 'border-field-600 bg-field-600'
                        : active
                          ? 'border-field-600'
                          : 'border-white/60'
                    }`}
                  >
                    {n > 0 && <Check className="size-2.5 text-white" strokeWidth="3" />}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-sm leading-5 font-bold ${
                      active ? 'text-field-900' : 'text-white'
                    }`}
                  >
                    {s.label}
                  </span>
                  {n > 0 && (
                    <span
                      className={`shrink-0 rounded-full px-1.5 text-xs leading-[18px] font-bold ${
                        active ? 'bg-field-50 text-field-700' : 'bg-white/20 text-white'
                      }`}
                    >
                      {n}
                    </span>
                  )}
                </span>
                {active && (
                  <span className="pl-6 text-xs leading-[18px] font-medium text-field-700">
                    {s.hint}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 中央下方：快門 ── */}
      <div className="absolute bottom-[38px] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2.5">
        <p className="rounded-md bg-field-900/60 px-3 py-1.5 text-sm leading-5 font-bold text-white">
          {current ? `正在拍：${current.label}` : '所有角度都拍過了，可自由補拍'}
        </p>
        <button
          onClick={shutter}
          aria-label="按下快門"
          className="flex size-[68px] items-center justify-center rounded-full border-[3px] border-white/70"
        >
          <span className="size-[56px] rounded-full bg-white transition-transform active:scale-90" />
        </button>
      </div>

      {/* ── 左下：本次拍攝縮圖串 ── */}
      <div className="absolute bottom-[38px] left-8 z-20 flex items-end gap-3">
        <div className="relative shrink-0">
          {shots.length === 0 ? (
            <div className="flex items-center justify-center rounded-md bg-field-900/50 p-2 shadow-md">
              <Image className="size-[39px] text-white" />
            </div>
          ) : (
            <button
              onClick={finishShooting}
              aria-label="檢視本次拍攝並標籤"
              className="relative block size-12 overflow-hidden rounded-md border-2 border-white shadow-md"
            >
              <ThumbArt />
            </button>
          )}
          {shots.length > 0 && (
            <span className="absolute -top-3 left-9 flex size-6 items-center justify-center rounded-xl border-2 border-white bg-danger text-xs leading-[18px] font-medium text-white">
              {shots.length}
            </span>
          )}
        </div>

        {shots.length > 0 && (
          <button
            onClick={() => setShots((v) => v.slice(0, -1))}
            className="flex h-9 items-center gap-1.5 rounded-md bg-field-900/50 px-3 text-xs leading-[18px] font-bold text-white"
          >
            <RotateCcw className="size-3.5" />
            刪除最後一張
          </button>
        )}
      </div>

      {/* ── 右下：拍照／錄影切換 ── */}
      <div className="absolute right-9 bottom-[38px] z-20 flex items-center gap-3.5">
        {['photo', 'video'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-base leading-6 font-bold ${
              mode === m ? 'text-field-300' : 'text-white/70'
            }`}
          >
            {m === 'photo' ? '拍照' : '錄影'}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══════════ 圖片標籤畫面 ═══════════
   Figma F7-3（批次標籤）＋ F7-5／F7-6（單張詳情與標籤放置）兩種模式並存。

   ★ 為什麼要兩種：現場照片一多、狀況一多，不可能一張一張慢慢標。
     所以拍完只有 1 張 → 直接進單張詳細標記；
     拍完有多張 → 預設進圖庫批次標記，選幾張、點標籤一次套用；
     要對某一張做細部標記（例如把「毛髮局部脫落」釘在患部）再點那張進詳細。

   ★ 標籤的操作邏輯（平板單手）：整塊標籤都可點，不用瞄準小圖示。
     點一下標籤 → 成為這張照片的**全局標籤**；
     點完標籤緊接著點照片上的某個位置 → 同一個標籤就變成**定位標籤**。 */
function TagReview({ target, targetLabel, shots, setShots, onBack, onDone }) {
  /* 只有一張就不用先看圖庫 */
  const [view, setView] = useState(shots.length === 1 ? 'detail' : 'gallery')
  const [active, setActive] = useState(0)
  const [picked, setPicked] = useState(() => shots.map((s) => s.id)) // 圖庫模式的多選
  const [custom, setCustom] = useState('')
  const [customOpen, setCustomOpen] = useState(false)
  /* 剛剛點過的標籤：接著點照片就把它轉成定位標籤 */
  const [armed, setArmed] = useState(null)

  const suggested = useMemo(() => suggestedTags(target), [target])
  const cur = shots[active]
  const untagged = shots.filter((s) => s.tags.length === 0).length

  const patch = (id, fn) => setShots((v) => v.map((s) => (s.id === id ? fn(s) : s)))
  const addTo = (ids, tag) =>
    setShots((v) =>
      v.map((s) =>
        ids.includes(s.id) && !s.tags.some((t) => t.label === tag.label && t.x == null)
          ? { ...s, tags: [...s.tags, { ...tag, x: null, y: null }] }
          : s,
      ),
    )

  /** 點標籤：詳情模式加到目前這張並待命放置；圖庫模式套用到所有已選的照片 */
  const onTagClick = (tag) => {
    if (view === 'detail') {
      if (!cur) return
      addTo([cur.id], tag)
      setArmed(tag)
    } else {
      addTo(picked, tag)
      setArmed(null)
    }
  }

  /** 點大圖：把剛剛那個標籤從全局改成定位（存百分比，縮放不會跑掉） */
  const placePin = (e) => {
    if (!armed || !cur) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    /* ⚠️ 旗標一定要放在 updater 內部：StrictMode 會把 updater 跑兩次，
       若旗標宣告在外面，第二次執行時已是 true，整個 map 就會原封不動回傳。 */
    patch(cur.id, (s) => {
      let moved = false
      return {
        ...s,
        tags: s.tags.map((t) => {
          if (moved || t.label !== armed.label || t.x != null) return t
          moved = true
          return { ...t, x, y }
        }),
      }
    })
    setArmed(null)
  }

  const removeTagOf = (photoId, i) =>
    patch(photoId, (s) => ({ ...s, tags: s.tags.filter((_, j) => j !== i) }))
  const removeTag = (i) => removeTagOf(cur.id, i)

  const addCustom = () => {
    const label = custom.trim()
    if (!label) return
    onTagClick({ label, group: '未分類' })
    setCustom('')
    setCustomOpen(false)
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-canvas">
      <header className="flex h-[72px] shrink-0 items-center justify-between bg-field-900 pr-9 pl-5">
        <div className="flex items-center gap-3">
          <button
            onClick={view === 'detail' && shots.length > 1 ? () => setView('gallery') : onBack}
            className="flex size-12 items-center justify-center rounded-lg border-2 border-field-700 text-white"
            aria-label={view === 'detail' && shots.length > 1 ? '回到圖庫' : '回到拍攝'}
          >
            <ChevronLeft className="size-6" />
          </button>
          <div className="flex flex-col gap-0.5">
            <p className="text-xl leading-[30px] font-bold text-white">
              {view === 'gallery' ? '批次標記' : '照片標籤'}
            </p>
            <p className="text-xs leading-[18px] font-medium text-field-200">
              本次拍攝 {shots.length} 張｜{targetLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {untagged > 0 && (
            <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs leading-[18px] font-bold text-warning">
              {untagged} 張尚未標籤
            </span>
          )}
          {shots.length > 1 && (
            <button
              onClick={() => setView(view === 'gallery' ? 'detail' : 'gallery')}
              className="flex h-11 items-center gap-2 rounded-md border border-field-700 px-3.5 text-sm leading-5 font-bold text-white"
            >
              {view === 'gallery' ? <Image className="size-4" /> : <Grid className="size-4" />}
              {view === 'gallery' ? '逐張細標' : '回批次標記'}
            </button>
          )}
          <button
            onClick={onDone}
            className="flex h-11 items-center rounded-md bg-white px-4 text-sm leading-5 font-bold text-field-900 shadow-xs"
          >
            完成並回工作台
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-4 p-4">
        {view === 'gallery' ? (
          <GalleryPane
            shots={shots}
            picked={picked}
            setPicked={setPicked}
            onOpen={(i) => {
              setActive(i)
              setView('detail')
            }}
            onRemoveTag={removeTagOf}
          />
        ) : (
          <DetailPane
            shots={shots}
            active={active}
            setActive={setActive}
            cur={cur}
            armed={armed}
            setArmed={setArmed}
            placePin={placePin}
            removeTag={removeTag}
          />
        )}

        {/* ── 右：標籤面板（兩種模式共用） ── */}
        <section className="flex w-[352px] shrink-0 flex-col overflow-hidden rounded-md bg-white">
          <div className="flex h-16 shrink-0 items-center gap-2 px-5">
            <Tag className="size-5 text-neutral-900" />
            <h2 className="flex-1 text-xl leading-[30px] font-bold text-neutral-900">新增標籤</h2>
            <span className="text-xs leading-[18px] font-medium text-neutral-500">
              {view === 'gallery' ? `套用到 ${picked.length} 張` : `第 ${active + 1}／${shots.length} 張`}
            </span>
          </div>

          <p className="shrink-0 px-5 pb-2 text-xs leading-[18px] font-medium text-neutral-500">
            {view === 'gallery'
              ? '點標籤即套用到所有已勾選的照片'
              : '點標籤＝整張照片的標籤；點完再點照片位置＝定位標籤'}
          </p>

          <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6">
            {suggested.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm leading-5 font-bold text-neutral-900">建議標籤</p>
                  <AiBadge>依蒐證項目</AiBadge>
                </div>
                <div className="flex flex-col gap-1.5">
                  {suggested.map((t) => (
                    <TagRow
                      key={t.label}
                      tag={t}
                      highlight
                      armed={armed?.label === t.label}
                      onClick={() => onTagClick(t)}
                    />
                  ))}
                </div>
              </div>
            )}

            {TAG_GROUPS.map((g) => (
              <div key={g.key} className="flex flex-col gap-2">
                <p className="flex items-center gap-1.5 text-sm leading-5 font-bold text-neutral-900">
                  <span className={`size-2 rounded-full ${g.dot}`} />
                  {g.key}
                </p>
                <div className="flex flex-col gap-1.5">
                  {TAG_LIBRARY[g.key].map((label) => (
                    <TagRow
                      key={label}
                      tag={{ label, group: g.key }}
                      armed={armed?.label === label}
                      onClick={() => onTagClick({ label, group: g.key })}
                    />
                  ))}
                </div>
              </div>
            ))}

            {customOpen ? (
              <div className="flex items-center gap-2 rounded-md border border-field-600 bg-white px-3 py-2">
                <input
                  autoFocus
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                  placeholder="輸入自訂標籤後按 Enter"
                  className="flex-1 text-sm leading-5 outline-none placeholder:text-neutral-400"
                />
                <button onClick={addCustom} className="text-sm leading-5 font-bold text-field-700">
                  新增
                </button>
                <button onClick={() => setCustomOpen(false)} className="text-neutral-400">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCustomOpen(true)}
                className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white text-sm leading-5 font-bold text-field-700 shadow-xs"
              >
                <Plus className="size-4" />
                新增自訂標籤
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

/** 圖庫批次模式：勾選多張，右邊點標籤一次套用 */
function GalleryPane({ shots, picked, setPicked, onOpen, onRemoveTag }) {
  const allOn = picked.length === shots.length
  const toggle = (id) =>
    setPicked((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))

  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-white">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <h2 className="text-xl leading-[30px] font-bold text-neutral-900">本次拍攝</h2>
        <button
          onClick={() => setPicked(allOn ? [] : shots.map((s) => s.id))}
          className="h-10 rounded-md border border-neutral-300 bg-white px-3.5 text-sm leading-5 font-bold text-field-700 shadow-xs"
        >
          {allOn ? '取消全選' : '全選'}
        </button>
      </div>

      <div className="scroll-thin grid min-h-0 flex-1 auto-rows-max grid-cols-3 gap-3 overflow-y-auto px-5 pb-6">
        {shots.map((s, i) => {
          const on = picked.includes(s.id)
          return (
            <div
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`flex cursor-pointer flex-col overflow-hidden rounded-md border-2 ${
                on ? 'border-field-600' : 'border-neutral-200'
              }`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <PhotoArt seed={i} className="size-full" />
                <span
                  className={`absolute top-2 left-2 flex size-6 items-center justify-center rounded-sm border-2 ${
                    on ? 'border-field-600 bg-field-600' : 'border-white bg-black/30'
                  }`}
                >
                  {on && <Check className="size-4 text-white" strokeWidth="3" />}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpen(i)
                  }}
                  className="absolute right-2 bottom-2 flex h-8 items-center gap-1 rounded-md bg-white/95 px-2.5 text-xs leading-[18px] font-bold text-field-700 shadow-md"
                >
                  <MapPin className="size-3.5" />
                  細標
                </button>
              </div>
              <div className="flex flex-col gap-1 bg-neutral-50 px-2.5 py-2">
                <p className="truncate text-xs leading-[18px] font-bold text-neutral-900">
                  {s.shotLabel}
                </p>
                <div className="flex flex-wrap gap-1">
                  {s.tags.length === 0 ? (
                    <span className="text-xs leading-[18px] text-neutral-400">尚未加標籤</span>
                  ) : (
                    s.tags.map((t, j) => (
                      <span
                        key={`${t.label}-${j}`}
                        className="inline-flex items-center gap-1 rounded-full bg-white py-0.5 pr-0.5 pl-1.5 text-xs leading-[18px] font-medium text-neutral-700 shadow-xs"
                      >
                        <span className={`size-1.5 rounded-full ${DOT_BY_GROUP[t.group]}`} />
                        {t.label}
                        {t.x != null && <MapPin className="size-2.5 text-field-600" />}
                        {/* 批次標錯很容易發生，卡片上就要能直接拆掉 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveTag(s.id, j)
                          }}
                          aria-label={`移除標籤 ${t.label}`}
                          className="flex size-4 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** 單張詳細模式：大圖可點放定位標籤，下方縮圖列切換 */
function DetailPane({ shots, active, setActive, cur, armed, setArmed, placePin, removeTag }) {
  /* 點照片上的定位標籤 → 展開刪除鈕（點空白處會被 placePin 吃掉，所以要擋住冒泡） */
  const [pinMenu, setPinMenu] = useState(null)
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden rounded-md bg-white p-4">
      <div className="flex shrink-0 items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-base leading-6 font-bold text-neutral-900">
          {cur?.shotLabel}
        </p>
        {armed && (
          <span className="flex items-center gap-2 rounded-full bg-field-50 px-3 py-1.5 text-xs leading-[18px] font-bold text-field-700">
            <MapPin className="size-3.5" />
            點照片上的位置就能把「{armed.label}」變成定位標籤
            <button onClick={() => setArmed(null)} className="text-field-600">
              <X className="size-3.5" />
            </button>
          </span>
        )}
      </div>

      <div
        onClick={(e) => {
          setPinMenu(null)
          placePin(e)
        }}
        className={`relative min-h-0 flex-1 overflow-hidden rounded-md bg-neutral-900 ${
          armed ? 'cursor-crosshair ring-2 ring-field-600' : ''
        }`}
      >
        {cur && <PhotoArt seed={active} className="size-full" />}
        {cur?.tags.map((t, i) =>
          t.x == null ? null : (
            <span
              key={`${t.label}-${i}`}
              onClick={(e) => {
                e.stopPropagation()
                setPinMenu(pinMenu === i ? null : i)
              }}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-1 rounded-full bg-white/95 py-1 pr-2 pl-1.5 shadow-md ${
                pinMenu === i ? 'ring-2 ring-field-600' : ''
              }`}
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
            >
              <span className={`size-2 rounded-full ${DOT_BY_GROUP[t.group]}`} />
              <span className="text-xs leading-[18px] font-bold text-neutral-900">{t.label}</span>
              {pinMenu === i && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTag(i)
                    setPinMenu(null)
                  }}
                  aria-label={`移除標籤 ${t.label}`}
                  className="flex size-5 items-center justify-center rounded-full bg-danger text-white"
                >
                  <X className="size-3" />
                </button>
              )}
            </span>
          ),
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {cur?.tags.length === 0 && (
          <span className="text-xs leading-[18px] font-medium text-neutral-400">本張尚未加標籤</span>
        )}
        {cur?.tags.map((t, i) => (
          <span
            key={`${t.label}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white py-1.5 pr-2 pl-3 text-sm leading-5 font-medium text-neutral-800"
          >
            <span className={`size-2 rounded-full ${DOT_BY_GROUP[t.group]}`} />
            {t.label}
            {t.x != null && <MapPin className="size-3.5 text-field-600" />}
            <button onClick={() => removeTag(i)} className="text-neutral-400">
              <X className="size-4" />
            </button>
          </span>
        ))}
      </div>

      <div className="scroll-thin flex shrink-0 gap-2 overflow-x-auto pb-1">
        {shots.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            className={`relative size-[72px] shrink-0 overflow-hidden rounded-md border-2 ${
              i === active ? 'border-field-600' : 'border-transparent'
            }`}
          >
            <PhotoArt seed={i} className="size-full" />
            {s.tags.length > 0 && (
              <span className="absolute right-0.5 bottom-0.5 rounded-full bg-black/60 px-1.5 text-xs leading-[18px] font-medium text-white">
                {s.tags.length}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}

/** 標籤面板的一列 —— 平板操作：整塊都可點，不再拆成三個小按鈕 */
function TagRow({ tag, highlight, armed, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-11 w-full items-center gap-2 rounded-md border px-3 text-left ${
        armed
          ? 'border-field-600 bg-field-50 ring-2 ring-field-600'
          : highlight
            ? 'border-field-200 bg-field-50'
            : 'border-neutral-200 bg-white hover:bg-neutral-50'
      }`}
    >
      <span className={`size-2.5 shrink-0 rounded-full ${DOT_BY_GROUP[tag.group]}`} />
      <span
        className={`min-w-0 flex-1 truncate text-sm leading-5 font-medium ${
          highlight || armed ? 'text-field-700' : 'text-neutral-700'
        }`}
      >
        {tag.label}
      </span>
      {armed && <MapPin className="size-4 shrink-0 text-field-600" />}
    </button>
  )
}

/* ── 取景畫面：CSS 漸層 + inline SVG 自繪的失焦室內場景 ＋ 三分格線 ＋ 對焦框 ── */
function Viewfinder() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(165deg,#6c7d78 0%,#4d5c58 32%,#33403d 66%,#1c2624 100%)',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1194 834"
        preserveAspectRatio="none"
        style={{ filter: 'blur(20px)' }}
      >
        <rect x="700" y="0" width="494" height="470" fill="#7f918c" opacity="0.5" />
        <rect x="860" y="0" width="14" height="470" fill="#4a5a56" opacity="0.6" />
        <rect x="1020" y="0" width="14" height="470" fill="#4a5a56" opacity="0.6" />
        <rect x="0" y="470" width="1194" height="364" fill="#20292a" opacity="0.85" />
        <rect x="0" y="0" width="700" height="470" fill="#3a4644" opacity="0.45" />
        <rect x="150" y="300" width="420" height="300" rx="18" fill="#0d1414" opacity="0.55" />
        <ellipse cx="520" cy="560" rx="180" ry="120" fill="#5b514a" opacity="0.75" />
        <ellipse cx="640" cy="470" rx="86" ry="80" fill="#6a5f56" opacity="0.75" />
        <ellipse cx="700" cy="440" rx="22" ry="34" fill="#4c433c" opacity="0.7" />
        <ellipse cx="930" cy="690" rx="90" ry="42" fill="#39474a" opacity="0.8" />
      </svg>

      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-0 left-0 h-px bg-white/15" />
        <div className="absolute top-2/3 right-0 left-0 h-px bg-white/15" />
        <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/15" />
        <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/15" />
      </div>

      <div className="absolute top-1/2 left-[38%] size-[190px] -translate-x-1/2 -translate-y-1/2">
        <FocusCorner className="top-0 left-0" />
        <FocusCorner className="top-0 right-0 rotate-90" />
        <FocusCorner className="right-0 bottom-0 rotate-180" />
        <FocusCorner className="bottom-0 left-0 -rotate-90" />
        <div className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-field-300" />
      </div>

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

/* 縮圖／照片一律自繪，不引外部圖片 */
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
