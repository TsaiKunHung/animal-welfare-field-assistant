import { useState } from 'react'
import { navigate } from '../router.jsx'
import { useApp } from '../store/AppState.jsx'
import { AiBadge, Button, Checkbox } from '../components/ui.jsx'
import {
  AlignLeft,
  ChevronLeft,
  Clock,
  Cloud,
  Edit,
  FileText,
  Lock,
  Pause,
  Play,
} from '../components/icons.jsx'

/*
  F14 限期改善單 — 正式行政處分文件，直接引用法條並要求現場簽收。
  Figma page 11620:15507「F14 限期改善單」：
    F14-1   限期改善單              (11620:15508) → 本檔主畫面
    F14-1-1 限期改善單/受訪人簽名   (12068:2685)  → 簽名彈窗 signing === 'visitor'
    F14-1-2 限期改善單/動檢查簽名   (12068:2906)  → 簽名彈窗 signing === 'officer'
                                                    （稿面 frame 名寫「動檢查」，內容標題是「動檢員簽名」，
                                                      依專案用詞一律「動檢員」）
    展開後                          (11629:16689) → 同一張 Body 的完整高度版本，本檔用可捲動卡片承載。

  與 Figma 稿面的刻意差異（稿面是舊版殘留，依 AGENT_BRIEF 修正）：
  - 稿面案件是「0927492927／四維路米克斯貓／臺北市大安區」，一律改用 state.activeCase
    （AC-1150811-003｜文化路米克斯犬｜新北市板橋區），稽查紀錄文案同步改寫成犬隻案。
  - 稿面稽查時間寫 115 年 6 月 19 日，本案是 115/08/11。
  - 稿面罰則金額寫「3千元以上1萬5千元以下」，與 F12 摘要一致改寫為
    「新臺幣 3,000 元以上 15,000 元以下」。
  - 稿面「注意事項」第一條寫「請書寫與本處聯絡。」語意不通（舊版殘留），改為
    「請於改善期限屆滿前主動與本處聯絡。」
*/

/* ── 左側工具列（Figma「Field tool rail」，與 F12/F13 同一條，限期改善單為目前頁） ── */
const TOOLS = [
  { key: 'summary', label: 'AI摘要', icon: AlignLeft, route: 'f12' },
  { key: 'record', label: '案件紀錄單', icon: Edit, route: 'f13' },
  { key: 'improve', label: '限期改善單', icon: Clock, route: null },
  { key: 'found', label: '拾獲單', icon: FileText, route: 'f15' },
  { key: 'detain', label: '扣留單', icon: Lock, route: 'f16' },
]

/* ── 動物保護法第 5 條第 2 項 - 飼主照顧責任的應改善項目（Figma 原文） ── */
const IMPROVE_ITEMS = [
  { id: 'imp-1', label: '保持安全、舒適、通風且適當的飼養密度', done: true },
  { id: 'imp-2', label: '提供足夠遮蔽物以免受風吹雨淋', done: true },
  { id: 'imp-3', label: '若以繩或鍊圈養動物，其繩或鍊應長於寵物身形', done: true },
  { id: 'imp-4', label: '確保動物身體健康，無惡劣傷害或疾病', done: false },
  { id: 'imp-5', label: '提供適當的籠舍空間或活動空間', done: false },
  { id: 'imp-6', label: '提供安全、乾淨、排水、通風之飼養環境', done: false },
  { id: 'imp-7', label: '24小時供應乾淨且充足之飲食', done: false },
]

const PENALTY_ITEMS = [
  {
    id: 'pen-1',
    label:
      '違反動物保護法第5條第2項規定，經限期改善，屆期未改善者，處新臺幣 3,000 元以上 15,000 元以下罰鍰。',
    done: true,
  },
]

const NOTICE_ITEMS = [
  { id: 'not-1', label: '請於改善期限屆滿前主動與本處聯絡。', done: true },
  { id: 'not-2', label: '屬流浪犬貓，本處將依職權捕捉。', done: false },
]

const FALLBACK_RECORD =
  '接獲民眾陳情「文化路米克斯犬」，至現場稽查。現場於一樓騎樓發現犬隻飼養於狹小鐵籠內，籠底有糞便未清理，環境髒亂；食盆與水碗內空無一物，飲水已打翻。經勸導後，飼主承諾將於 14 日內完成改善並簽收本單，包含完成犬隻之寵物登記與就醫檢查。'

/** 手寫簽名示意（點一下簽名框才出現，不做真的手寫板） */
function Autograph({ className = '' }) {
  return (
    <svg viewBox="0 0 420 120" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M28 24v78M24 44c18-9 42-7 60-13M32 68c18-4 40-2 58-9M66 33l-4 72" />
        <path d="M124 30c18-7 35 4 27 20-8 16-29 12-23-4M116 82c22-11 51-7 68-17M150 50v46" />
        <path d="M216 26l-4 72M194 48c22-9 46-4 64-13M204 74c22-7 44-2 62-11" />
        <path d="M274 94c42 9 93 7 130-11" />
      </g>
    </svg>
  )
}

/** 可勾選的一列：整列都能點（Checkbox 的 onChange 給 noop，由外層 div 統一 toggle） */
function CheckRow({ checked, onToggle, children }) {
  return (
    <div
      className="flex w-full cursor-pointer items-start gap-2"
      onClick={onToggle}
      role="presentation"
    >
      <span className="flex shrink-0 items-center justify-center pt-0.5">
        <Checkbox checked={checked} onChange={() => {}} />
      </span>
      <p
        className={`min-w-px flex-1 text-sm leading-5 ${
          checked ? 'text-neutral-900' : 'text-neutral-400'
        }`}
      >
        {children}
      </p>
    </div>
  )
}

/** label / value 一列（label 固定 140px，Figma 的 Row/xxx） */
function Row({ label, children }) {
  return (
    <div className="flex w-full items-center gap-2 text-sm leading-5">
      <p className="w-[140px] shrink-0 text-neutral-500">{label}</p>
      <div className="min-w-px flex-1 text-ink">{children}</div>
    </div>
  )
}

/** 受訪人資料卡的一列：label 固定 112px，值可以是文字 / 底線輸入 / 簽名欄 */
function FormRow({ label, children }) {
  return (
    <div className="flex min-h-6 w-full items-center gap-2">
      <p className="w-28 shrink-0 text-sm leading-5 text-neutral-500">{label}</p>
      <div className="flex min-w-px flex-1 items-center gap-6">{children}</div>
    </div>
  )
}

/** 現場填寫的底線欄位 */
function FieldLine({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-[180px] border-b border-neutral-200 bg-transparent pb-0.5 text-sm leading-5 text-ink outline-none placeholder:text-neutral-300 focus:border-field-600"
    />
  )
}

/** 簽名欄位：未簽名顯示底線提示，點一下開簽名彈窗 */
function SignSlot({ label, signed, onOpen }) {
  return (
    <div className="flex items-center gap-2">
      {signed ? (
        <Autograph className="h-8 w-[141px] text-neutral-900" />
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="w-[141px] text-left text-sm leading-5 text-neutral-400 underline decoration-solid"
        >
          {label}
        </button>
      )}
      <button
        type="button"
        onClick={onOpen}
        className="flex size-6 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-field-700"
        aria-label={label}
      >
        <Edit className="size-4" />
      </button>
    </div>
  )
}

export default function F14ImprovementNotice() {
  const { state, dispatch } = useApp()
  const c = state.activeCase

  const [improve, setImprove] = useState(IMPROVE_ITEMS)
  const [penalty, setPenalty] = useState(PENALTY_ITEMS)
  const [notice, setNotice] = useState(NOTICE_ITEMS)
  const [sameAddress, setSameAddress] = useState(false)
  const [notSelf, setNotSelf] = useState(false)
  const [record, setRecord] = useState(FALLBACK_RECORD)
  const [contact, setContact] = useState({ phone: '', household: '', mail: '' })
  const [signed, setSigned] = useState({ visitor: false, officer: false })
  const [signing, setSigning] = useState(null) // 'visitor' | 'officer'
  const [playing, setPlaying] = useState(false)

  const toggle = (setter) => (id) =>
    setter((list) => list.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))

  const issue = () => {
    dispatch({
      type: 'ISSUE_DOCUMENT',
      payload: { type: 'improvement', label: '限期改善通知單' },
    })
    navigate('f13')
  }

  const ownerName = state.ownerId?.name ?? '陳O玲'
  const ownerId = state.ownerId?.idNumber ?? 'A******890'

  const SIGN_TITLE = { visitor: '受訪人簽名', officer: '動檢員簽名' }

  return (
    <div className="relative flex h-full w-full flex-col bg-canvas">
      {/* ── Top navigation / Field workspace ── */}
      <div className="flex h-[72px] shrink-0 items-center justify-between bg-field-900 pl-5 pr-9">
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
            <p className="text-xl leading-[30px] font-bold text-white">限期改善單</p>
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

        {/* 右：單據本體 */}
        <div className="scroll-thin flex h-full min-w-px flex-1 flex-col gap-3 overflow-y-auto rounded-md bg-white px-6 py-4">
          <div className="flex h-10 shrink-0 items-center">
            <p className="text-xl leading-[30px] font-bold whitespace-nowrap text-neutral-900">
              填寫限期改善單
            </p>
          </div>

          {/* 稽查基本資料 */}
          <div className="flex w-full shrink-0 flex-col justify-center gap-2 rounded-md border border-neutral-300 bg-white p-4">
            <Row label="稽查時間：">115 年 8 月 11 日 10 時 12 分</Row>
            <Row label="稽查地點：">{c.address}</Row>
            <Row label="稽查類別：">飼主</Row>
            <Row label="稽查場所：">屋外籠飼或綁鍊</Row>
          </div>

          {/* 法條 + 應改善項目 + 罰則 */}
          <div className="flex w-full shrink-0 flex-col justify-center gap-2.5 rounded-md border border-neutral-300 bg-white p-4">
            <p className="text-base leading-6 font-bold text-neutral-900">
              違反動物保護法第5條第2項－飼主照顧責任：
            </p>

            <div className="flex w-full flex-col gap-3">
              <p className="w-[140px] text-sm leading-5 font-medium text-ink-sub">應改善項目</p>
              <div className="flex w-full flex-col gap-2 px-4">
                {improve.map((i) => (
                  <CheckRow key={i.id} checked={i.done} onToggle={() => toggle(setImprove)(i.id)}>
                    {i.label}
                  </CheckRow>
                ))}
              </div>

              <p className="w-[140px] text-sm leading-5 font-medium text-ink-sub">罰則說明：</p>
              <div className="flex w-full flex-col gap-2 px-4">
                {penalty.map((i) => (
                  <CheckRow key={i.id} checked={i.done} onToggle={() => toggle(setPenalty)(i.id)}>
                    {i.label}
                  </CheckRow>
                ))}
              </div>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="flex w-full shrink-0 flex-col gap-2">
            <p className="text-base leading-6 font-bold text-neutral-900">注意事項</p>
            <div className="flex w-full flex-col gap-2 px-4">
              {notice.map((i) => (
                <CheckRow key={i.id} checked={i.done} onToggle={() => toggle(setNotice)(i.id)}>
                  {i.label}
                </CheckRow>
              ))}
            </div>
          </div>

          <div className="h-px w-full shrink-0 bg-neutral-200" />

          {/* 稽查紀錄 */}
          <div className="flex w-full shrink-0 flex-col gap-2 rounded-md border border-neutral-200 bg-white px-4 py-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <p className="text-lg leading-7 font-bold text-field-700">稽查紀錄：</p>
              <AiBadge>AI Assist</AiBadge>
            </div>
            <textarea
              value={record}
              rows={3}
              onChange={(e) => setRecord(e.target.value)}
              className="scroll-thin w-full resize-none rounded-sm bg-transparent px-2 py-1.5 text-xs leading-[18px] text-ai-700 outline-none focus:bg-field-50"
            />
          </div>

          {/* 受訪人 / 動檢員資料與簽名（label 與值同一列，避免兩欄各自堆疊後對不齊） */}
          <div className="flex w-full shrink-0 flex-col gap-5 rounded-md border border-neutral-200 bg-white px-4 py-4 shadow-xs">
            <FormRow label="飼主姓名：">
              <span className="text-sm leading-5 text-ink">{ownerName}</span>
            </FormRow>
            <FormRow label="身分證字號：">
              <span className="text-sm leading-5 text-ink">{ownerId}</span>
            </FormRow>
            <FormRow label="聯絡電話：">
              <FieldLine
                value={contact.phone}
                onChange={(v) => setContact((s) => ({ ...s, phone: v }))}
                placeholder="現場填寫"
              />
            </FormRow>
            <FormRow label="戶籍地址：">
              <FieldLine
                value={contact.household}
                onChange={(v) => setContact((s) => ({ ...s, household: v }))}
                placeholder="現場填寫"
              />
            </FormRow>
            <FormRow label="通訊地址：">
              <FieldLine
                value={sameAddress ? contact.household : contact.mail}
                onChange={(v) => setContact((s) => ({ ...s, mail: v }))}
                placeholder="現場填寫"
              />
              <span
                className="flex cursor-pointer items-center gap-2"
                onClick={() => setSameAddress((v) => !v)}
              >
                <Checkbox checked={sameAddress} onChange={() => {}} />
                <span className="text-sm leading-5 whitespace-nowrap text-neutral-900">
                  同戶籍地址
                </span>
              </span>
            </FormRow>
            <FormRow label="受訪人簽名：">
              <SignSlot
                label="受訪人姓名(點擊簽名)"
                signed={signed.visitor}
                onOpen={() => setSigning('visitor')}
              />
              <span className="h-1 flex-1" />
              <span
                className="flex cursor-pointer items-center gap-2"
                onClick={() => setNotSelf((v) => !v)}
              >
                <Checkbox checked={notSelf} onChange={() => {}} />
                <span className="text-sm leading-5 whitespace-nowrap text-neutral-900">
                  非本人，與飼主關係為：________
                </span>
              </span>
            </FormRow>
            <FormRow label="動檢員：">
              <SignSlot
                label="稽查員姓名(點擊簽名)"
                signed={signed.officer}
                onOpen={() => setSigning('officer')}
              />
            </FormRow>
          </div>

          {/* 頁尾動作 */}
          <div className="flex w-full shrink-0 items-center justify-between pt-1 pb-2">
            <span className="text-xs leading-[18px] text-neutral-500">
              開立後將自動歸入本案附件，並回到案件紀錄單。
            </span>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => navigate('f13')}>
                預覽正式 PDF
              </Button>
              <Button onClick={issue}>確認開立</Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer：錄音紀錄 ── */}
      <div className="flex h-20 shrink-0 items-center gap-5 border-t border-neutral-200 bg-white pr-7 pl-6">
        <p className="w-[68px] shrink-0 text-base leading-6 font-bold text-ink">錄音紀錄</p>
        <span className="h-1 flex-1" />
        <div className="flex w-[432px] shrink-0 items-center gap-5">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            className="flex size-[46px] shrink-0 items-center justify-center rounded-md border border-field-600 bg-field-600 text-white"
            aria-label={playing ? '暫停播放' : '播放錄音'}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <div className="flex h-[46px] min-w-px flex-1 flex-col justify-end gap-[3px]">
            <div className="h-[7px] w-full rounded-[5px] bg-neutral-300">
              <div
                className={`h-full rounded-[5px] bg-field-600 transition-all ${
                  playing ? 'w-1/4' : 'w-0'
                }`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] leading-[18px] text-neutral-900">
              <span>0:00</span>
              <span>2:34</span>
            </div>
          </div>
        </div>
        <span className="h-1 flex-1" />
        <button
          type="button"
          onClick={() => navigate('f13')}
          className="flex h-[46px] shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-sm leading-5 font-medium text-neutral-700"
        >
          查看完整逐字稿
        </button>
      </div>

      {/* ── F14-1-1 / F14-1-2 簽名彈窗 ── */}
      {signing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[rgba(15,23,41,0.45)]" onClick={() => setSigning(null)} />
          <div className="relative flex w-[600px] flex-col gap-6 rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2">
              <Edit className="size-5 text-neutral-700" />
              <p className="text-lg leading-7 font-bold text-ink">{SIGN_TITLE[signing]}</p>
            </div>
            <button
              type="button"
              onClick={() => setSigned((s) => ({ ...s, [signing]: true }))}
              className="flex h-[130px] w-full items-center justify-center rounded-md border border-neutral-300 bg-white"
            >
              {signed[signing] ? (
                <Autograph className="h-[100px] w-[420px] max-w-full px-6 text-neutral-900" />
              ) : (
                <span className="text-sm leading-5 font-medium text-neutral-400">
                  在此處手寫簽名
                </span>
              )}
            </button>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setSigned((s) => ({ ...s, [signing]: false }))
                  setSigning(null)
                }}
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  setSigned((s) => ({ ...s, [signing]: true }))
                  setSigning(null)
                }}
              >
                確認
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
