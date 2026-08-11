import { Link } from '../router.jsx'
import { Card } from '../components/ui.jsx'

const pages = [
  { id: 'f0', name: '外勤登入頁', note: '登入 / 忘記密碼 / 重設 / 歡迎頁' },
  { id: 'f1', name: '單日行程規劃', note: '路線地圖＋案件排序＋綜合提醒事項' },
  { id: 'f2', name: '案件預覽', note: '出勤前確認：街景、報案人、過往案例' },
  { id: 'f3', name: '外勤工作主頁', note: '逐字稿＋checklist＋錄音列（含 F4/F8/F11）' },
  { id: 'f5', name: '飼主身分查詢', note: '證件掃描 OCR' },
  { id: 'f6', name: '寵物資訊查詢', note: '線上寵物登記查詢' },
  { id: 'f7', name: '瀏覽案件照片', note: '分類、標籤、AI 命名' },
  { id: 'f9', name: '案件內容', note: '蒐證中可回頭補充編輯' },
  { id: 'f10', name: '拍攝介面', note: '全螢幕取景／補拍' },
  { id: 'f12', name: '結果 AI 摘要', note: '整案總結，可逐段編輯' },
  { id: 'f13', name: '外勤案件紀錄單', note: '含附件清單與簽名' },
  { id: 'f14', name: '限期改善單', note: '行政處分文件' },
  { id: 'f15', name: '拾獲單', note: '拾獲動物登記' },
  { id: 'f16', name: '扣留單', note: '含 AI 適用性判斷' },
]

export default function Index() {
  return (
    <div className="scroll-thin h-full w-full overflow-y-auto p-10">
      <div className="mx-auto max-w-[1000px]">
        <h1 className="text-2xl leading-8 font-bold text-ink">外勤小助手 · 高保真原型</h1>
        <p className="mt-2 text-sm leading-5 text-ink-sub">
          第三版（2026-08）。設計來源：Figma「動保 Design System」外勤小助手 F0–F16。
        </p>
        <div className="mt-8 grid grid-cols-3 gap-4">
          {pages.map((p) => (
            <Link key={p.id} to={p.id} className="block">
              <Card className="h-full p-5 transition-shadow hover:shadow-md">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs leading-[18px] font-bold text-field-600 uppercase">
                    {p.id}
                  </span>
                  <span className="text-base leading-6 font-bold text-ink">{p.name}</span>
                </div>
                <p className="mt-1.5 text-sm leading-5 text-ink-sub">{p.note}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
