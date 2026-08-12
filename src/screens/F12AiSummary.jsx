import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { AiBadge, Button } from '../components/ui.jsx'
import {
  AlignLeft,
  ChevronLeft,
  Clipboard,
  Clock,
  Cloud,
  Edit,
  FileText,
  Flag,
  Lock,
  MessageCircle,
  Star,
} from '../components/icons.jsx'

/*
  F12 結果 AI 摘要頁 — 點完 F3「完成現場紀錄」之後的下一步：
  從「蒐證中」切到「整理／審閱中」，把逐字稿 / checklist / 照片 / 筆記彙整成結構化報告。

  Figma page 10904:2471「F12 結果AI摘要頁」，三個 frame：
    F12-1 結果AI摘要頁      (11592:1220)  → 主畫面（本檔預設狀態）
    F12-1-1 結果AI摘要頁編輯 (11620:15357) → 區塊編輯狀態（editing === key，框線轉 field-600 + textarea）
    案件資訊展開後           (11620:15247) → 同一張卡片的完整高度版本，內容與 F12-1 相同，
                                            本檔用可捲動卡片承載，不另做一個狀態。

  與 Figma 稿面的刻意差異（稿面是舊版殘留，依專案設定修正）：
  - 稿面案件為「四維路米克斯貓／台北市大安區／貓」，本頁一律以 state.activeCase 為準
    （文化路米克斯犬｜新北市板橋區｜犬）。
  - 稿面「案件類型」欄位的值填的是案件標題（0927492927 那筆），這裡改回真正的案件類型。
  - 稿面 AI 產出文字用紫色（Purple/700 #7e22ce），但 tokens 沒有紫色色階；
    依 AGENT_BRIEF「不要寫死 hex／不要發明色階」，改以 <AiBadge> 標示 AI 來源，內文用 neutral。
*/


/* ── 左側工具列（Figma「Field tool rail」，AI摘要為目前頁） ── */
const TOOLS = [
  { key: 'summary', label: 'AI摘要', icon: AlignLeft, route: null },
  { key: 'record', label: '案件紀錄單', icon: Edit, route: 'f13' },
  { key: 'improve', label: '限期改善單', icon: Clock, route: 'f14' },
  { key: 'found', label: '拾獲單', icon: FileText, route: 'f15' },
  { key: 'detain', label: '扣留單', icon: Lock, route: 'f16' },
]

/* ── checklist 勾選 → 重要發現的觀察句（使用者沒勾就走 FALLBACK） ── */
const OBSERVATION = {
  'env-1': '飼養場所位於一樓騎樓，鐵籠緊靠外牆，遮蔽不足。',
  'env-2': '通風尚可但長期未清理，周邊環境有明顯異味。',
  'env-3': '地面可見排泄物與打翻的飲水，食盆內無乾淨飼料。',
  'ani-1': '米克斯犬 1 隻，體型中等、毛髮局部脫落。',
  'ani-2': '活動力與精神尚可，對外界仍有反應。',
  'ani-3': '未見明顯外傷，皮膚有搔抓痕跡，建議就醫確認。',
  'own-1': '飼主到場配合稽查，已確認身分與聯絡方式。',
  'own-2': '寵物登記與晶片資料查詢完成，飼主資料相符。',
}

const FALLBACK_FINDINGS = {
  環境紀錄: [
    '飼養場所位於一樓騎樓，鐵籠緊靠外牆，遮蔽不足。',
    '周邊環境有異味，地面可見排泄物與打翻的飲水。',
  ],
  動物狀況: [
    '米克斯犬 1 隻，體型中等、毛髮局部脫落。',
    '精神尚可，未見明顯外傷。',
  ],
  飼主資訊: [
    '飼主到場配合稽查，已確認身分與聯絡方式。',
    '寵物登記與晶片資料查詢完成，資料相符。',
  ],
}

const FALLBACK_STATEMENTS = [
  { time: '10:25:04', speaker: '飼主陳述', text: '水剛剛被牠打翻了，脫毛之前有看過醫生。' },
  { time: '10:27:18', speaker: '飼主陳述', text: '白天要上班，晚上回來才會放牠出來走一走。' },
]

const FALLBACK_LAW = [
  '違反《動物保護法》第 5 條第 2 項規定。（飼主對於其管領之動物，應提供安全、乾淨、通風、排水、適當及充足之遮蔽、照明、溫度之生活環境）',
  '如屆期未改善，得依同法第 30 條第 1 項第 1 款處新臺幣 3,000 元以上 15,000 元以下罰鍰，並得按次處罰。',
]

const FALLBACK_ACTION = ['勸導。飼主承諾將改善，並同意簽收限期改善單。']
const FALLBACK_DEADLINE = ['要求立即補充飲水並於 7 日內帶動物就醫，30 日內完成環境改善並回報。']

/** 把 state 攤平成本頁的結構化摘要；state 是空的（直接跳 f12）就用預設假資料 */
function buildSummary({ activeCase, checklist, photos, notes, transcript, ownerId, petRecord }) {
  const groups = ['環境紀錄', '動物狀況', '飼主資訊']
  const findings = groups.map((label) => {
    const hits = checklist
      .filter((c) => c.group === label && c.done)
      .map((c) => OBSERVATION[c.id] ?? c.label)
    return { label, bullets: hits.length > 0 ? hits : FALLBACK_FINDINGS[label] }
  })

  const doneCount = checklist.filter((c) => c.done).length
  const photoCount = photos.length > 0 ? photos.length : 12
  const shownDone = doneCount > 0 ? doneCount : 6

  const overview =
    `現場發現 ${activeCase.animal.count} 隻${activeCase.animal.breed}${activeCase.animal.species}` +
    `以鐵籠關於一樓騎樓，遮蔽與飲水不足；已完成 ${shownDone}/${checklist.length} 項蒐證、照片 ${photoCount} 張。`

  const spoken = transcript.filter((s) => s.text && s.speaker !== '動檢員').slice(0, 3)
  const statements =
    spoken.length > 0
      ? spoken.map((s) => ({
          time: s.t ?? '10:25:04',
          speaker: `${s.speaker ?? '飼主'}陳述`,
          text: s.text,
        }))
      : FALLBACK_STATEMENTS

  const noteLines = notes
    .map((n) => (typeof n === 'string' ? n : (n.text ?? n.content ?? '')))
    .filter(Boolean)

  return {
    facts: [
      { label: '案件類型', value: activeCase.type },
      { label: '案件編號', value: activeCase.id },
      { label: '地址', value: activeCase.address },
      // 飼主姓名一律匿名顯示（專案已定規格，見 F5/F6 的寵登匿名格式）
      { label: '稽查對象 (飼主)', value: ownerId?.name ?? '陳O玲' },
      {
        label: 'AI 判讀置信度',
        value: petRecord ? '高（0.91）— 已比對寵物登記資料' : '高（0.87）',
      },
    ],
    overview,
    findings,
    statements,
    law: [{ label: '違反法條', bullets: FALLBACK_LAW }],
    followup: [
      { label: '後續處理', bullets: noteLines.length > 0 ? noteLines : FALLBACK_ACTION },
      { label: '改善期限', bullets: FALLBACK_DEADLINE },
    ],
  }
}

/* ── 版面小元件 ── */

function Bullets({ items }) {
  return (
    // AI 產生的內文在 Figma 是紫色（ai-700），與人工填寫的欄位視覺上分得開
    <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-[18px] text-ai-700">
      {items.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  )
}

/** 區塊標題列：圖示 + 標題 + AiBadge + 右側編輯／儲存 */
function SectionHead({ icon: Icon, title, editing, onEdit, onSave, onCancel }) {
  return (
    <div className="flex w-full shrink-0 items-center gap-2">
      <Icon className="size-6 shrink-0 text-neutral-900" />
      {/* Figma 的區塊標題是深色 ink，不是主色；主色只用在按鈕與連結 */}
      <p className="text-lg leading-7 font-bold whitespace-nowrap text-ink">{title}</p>
      <AiBadge>AI Assist</AiBadge>
      <span className="h-1 flex-1" />
      {editing ? (
        <span className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button size="sm" onClick={onSave}>
            儲存
          </Button>
        </span>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-field-700"
          aria-label={`編輯${title}`}
        >
          <Edit className="size-4" />
        </button>
      )}
    </div>
  )
}

function Box({ editing, className = '', children }) {
  return (
    <div
      className={`w-full shrink-0 rounded-md border bg-white px-4 py-2.5 shadow-xs ${
        editing ? 'border-field-600 ring-1 ring-field-600' : 'border-neutral-200'
      } ${className}`}
    >
      {children}
    </div>
  )
}

/** 編輯用 textarea：外框由 Box 提供，這裡只給底色，不再疊一層框 */
function BulletEditor({ value, onChange, rows = 3 }) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="scroll-thin w-full resize-none rounded-sm bg-field-50 px-2 py-1.5 text-xs leading-[18px] text-neutral-700 outline-none"
    />
  )
}

/** 多欄位區塊（重要發現 / 相關法規與處置 / 後續處理）共用 */
function ColumnsSection({ icon, title, columns, editing, draft, onEdit, onSave, onCancel, onDraft }) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-4">
      <SectionHead
        icon={icon}
        title={title}
        editing={editing}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
      />
      <Box editing={editing}>
        <div className="flex w-full items-start gap-4">
          {columns.map((col, i) => (
            <div key={col.label} className="flex min-w-px flex-1 flex-col gap-2">
              <p className="text-sm leading-5 font-medium whitespace-nowrap text-ink">
                {col.label}
              </p>
              {editing ? (
                <BulletEditor
                  value={draft[i] ?? ''}
                  rows={Math.max(3, col.bullets.length + 1)}
                  onChange={(v) => onDraft(i, v)}
                />
              ) : (
                <Bullets items={col.bullets} />
              )}
            </div>
          ))}
        </div>
      </Box>
    </div>
  )
}

export default function F12AiSummary() {
  const { state, dispatch, checklistDone, checklistTotal } = useApp()
  const c = state.activeCase

  const initial = useMemo(
    () =>
      buildSummary({
        activeCase: c,
        checklist: state.checklist,
        photos: state.photos,
        notes: state.notes,
        transcript: state.transcript,
        ownerId: state.ownerId,
        petRecord: state.petRecord,
      }),
    // 只在進頁時彙整一次；之後以使用者編輯結果為準
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [summary, setSummary] = useState(initial)
  const [editing, setEditing] = useState(null) // 'overview' | 'findings' | 'statements' | 'law' | 'followup'
  const [draft, setDraft] = useState([])

  // 摘要寫回全域 state（F13 的附件清單會用到）
  useEffect(() => {
    dispatch({ type: 'SET_AI_SUMMARY', payload: summary })
  }, [summary, dispatch])

  const startEdit = (key, lines) => {
    setEditing(key)
    setDraft(lines)
  }
  const setDraftAt = (i, v) => setDraft((d) => d.map((x, j) => (j === i ? v : x)))
  const cancel = () => {
    setEditing(null)
    setDraft([])
  }
  const toBullets = (text) =>
    text
      .split('\n')
      .map((l) => l.replace(/^[・‧·•\-\s]+/, '').trim())
      .filter(Boolean)

  const saveColumns = (key) => {
    setSummary((s) => ({
      ...s,
      [key]: s[key].map((col, i) => ({ ...col, bullets: toBullets(draft[i] ?? '') })),
    }))
    cancel()
  }

  const doneLabel = `${checklistDone || 6}/${checklistTotal}`

  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      {/* ── Top navigation / Field workspace ── */}
      <div className="flex h-[72px] shrink-0 items-center justify-between bg-field-900 pl-5 pr-9">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('f3')}
            className="flex size-12 items-center justify-center rounded-lg border-2 border-field-700 text-white"
            aria-label="返回工作台"
          >
            <ChevronLeft className="size-6" />
          </button>
          <div className="flex flex-col gap-0.5">
            <p className="text-xl leading-[30px] font-bold text-white">AI 摘要</p>
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

        {/* 右：案件資訊 + AI 摘要卡 */}
        <div className="flex h-full min-w-px flex-1 flex-col overflow-hidden rounded-md bg-white">
          <div className="scroll-thin flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-2.5">
            {/* 案件資訊（數據欄位 key-value） */}
            <div className="flex w-full shrink-0 flex-col">
              <div className="flex h-16 shrink-0 items-center justify-between">
                <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-neutral-900">
                  案件資訊
                </p>
                <span className="text-xs leading-[18px] font-medium text-neutral-500">
                  已彙整逐字稿、蒐證項目 {doneLabel}、照片{' '}
                  {state.photos.length > 0 ? state.photos.length : 12} 張
                </span>
              </div>
              <div className="flex w-full flex-col rounded-md px-2.5 py-2">
                {summary.facts.map((f) => (
                  <div key={f.label} className="flex h-6 items-center gap-2.5">
                    <span className="w-[94px] shrink-0 text-xs leading-[18px] font-medium text-neutral-500">
                      {f.label}
                    </span>
                    <span className="text-sm leading-5 font-medium text-neutral-800">
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 稽查概況 */}
            <div className="flex w-full shrink-0 flex-col gap-4">
              <SectionHead
                icon={FileText}
                title="稽查概況"
                editing={editing === 'overview'}
                onEdit={() => startEdit('overview', [summary.overview])}
                onCancel={cancel}
                onSave={() => {
                  setSummary((s) => ({ ...s, overview: (draft[0] ?? '').trim() }))
                  cancel()
                }}
              />
              <Box editing={editing === 'overview'}>
                {editing === 'overview' ? (
                  <textarea
                    value={draft[0] ?? ''}
                    rows={3}
                    onChange={(e) => setDraftAt(0, e.target.value)}
                    className="scroll-thin w-full resize-none rounded-sm bg-field-50 px-2 py-1.5 text-sm leading-5 text-neutral-700 outline-none"
                  />
                ) : (
                  <p className="text-sm leading-5 text-neutral-700">{summary.overview}</p>
                )}
              </Box>
            </div>

            {/* 重點標記 / 重要發現 */}
            <ColumnsSection
              icon={Star}
              title="重要發現"
              columns={summary.findings}
              editing={editing === 'findings'}
              draft={draft}
              onEdit={() =>
                startEdit(
                  'findings',
                  summary.findings.map((f) => f.bullets.join('\n')),
                )
              }
              onCancel={cancel}
              onSave={() => saveColumns('findings')}
              onDraft={setDraftAt}
            />

            {/* 對話重點 / 當事人陳述 */}
            <div className="flex w-full shrink-0 flex-col gap-4">
              <SectionHead
                icon={MessageCircle}
                title="當事人陳述"
                editing={editing === 'statements'}
                onEdit={() => startEdit('statements', summary.statements.map((s) => s.text))}
                onCancel={cancel}
                onSave={() => {
                  setSummary((s) => ({
                    ...s,
                    statements: s.statements
                      .map((st, i) => ({ ...st, text: (draft[i] ?? '').trim() }))
                      .filter((st) => st.text),
                  }))
                  cancel()
                }}
              />
              <Box editing={editing === 'statements'} className="flex flex-col gap-2.5 px-3">
                {summary.statements.map((s, i) => (
                  <div key={i} className="flex w-full items-start gap-2">
                    <div className="min-w-px flex-1">
                      {editing === 'statements' ? (
                        <BulletEditor
                          value={draft[i] ?? ''}
                          rows={2}
                          onChange={(v) => setDraftAt(i, v)}
                        />
                      ) : (
                        <p className="text-sm leading-5 text-neutral-700">“ {s.text} ”</p>
                      )}
                    </div>
                    <span className="mt-0.5 shrink-0 rounded-md border border-field-200 bg-field-50 px-2 py-1 text-xs leading-[18px] font-medium text-field-700">
                      {s.speaker} {s.time}
                    </span>
                  </div>
                ))}
              </Box>
            </div>

            {/* 相關法規與處置 */}
            <ColumnsSection
              icon={Clipboard}
              title="相關法規與處置"
              columns={summary.law}
              editing={editing === 'law'}
              draft={draft}
              onEdit={() => startEdit('law', summary.law.map((f) => f.bullets.join('\n')))}
              onCancel={cancel}
              onSave={() => saveColumns('law')}
              onDraft={setDraftAt}
            />

            {/* 現場處置與約定 / 後續處理 */}
            <ColumnsSection
              icon={Flag}
              title="後續處理"
              columns={summary.followup}
              editing={editing === 'followup'}
              draft={draft}
              onEdit={() =>
                startEdit(
                  'followup',
                  summary.followup.map((f) => f.bullets.join('\n')),
                )
              }
              onCancel={cancel}
              onSave={() => saveColumns('followup')}
              onDraft={setDraftAt}
            />
          </div>

          {/* 頁尾主要動作 */}
          <div className="flex shrink-0 items-center justify-between border-t border-hairline px-5 py-3">
            <span className="text-xs leading-[18px] text-neutral-500">
              摘要確認後可直接帶入單據，單據內仍可再修改。
            </span>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => navigate('f14')}>
                開立限期改善單
              </Button>
              <Button onClick={() => navigate('f13')}>開立案件紀錄單</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
