/*
  圖示 —— **Feather Icons**（24×24 網格、stroke=currentColor、strokeWidth 2、round cap/join）

  ⚠️ 2026-08-11 更正：Figma「動保 Design System」的 FOUNDATIONS ↳ Icons 頁 (1025:31781)
     用的是 Feather，不是 lucide。本檔原本是「lucide 風格自繪」的近似形狀，
     相機、圖片、鉛筆、搜尋、使用者…等幾乎每一顆都和稿面對不起來。
     現在改成 Feather 的原始 path data，命名沿用 Feather 名稱（PascalCase）方便對照。

  ⚠️ 從 Figma 查到的實際用途（F3 page 10069:948 的 instance → mainComponent）：
       工具列        user / search / image / file-text / book-open
       蒐證清單 action camera（待拍照）、image（已有照片）、edit（文字紀錄）
       標記重點      bookmark（不是 flag）
       結束錄音      stop-circle（不是 square）
       返回 / 同步    chevron-left / cloud

  不引外部 icon font／CDN：離線也要能 demo。
*/

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

/* ═══════════════ Feather ═══════════════ */

export const AlertOctagon = (p) => (
  <Svg {...p}>
    <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z" />
    <path d="M12 8v4M12 16h.01" />
  </Svg>
)
export const AlertTriangle = (p) => (
  <Svg {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
)
export const AlignLeft = (p) => (
  <Svg {...p}>
    <path d="M17 10H3M21 6H3M21 14H3M17 18H3" />
  </Svg>
)
export const ArrowDownRight = (p) => (
  <Svg {...p}>
    <path d="M7 7l10 10M17 7v10H7" />
  </Svg>
)
export const ArrowLeft = (p) => (
  <Svg {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)
export const ArrowRight = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
)
export const BarChart2 = (p) => (
  <Svg {...p}>
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </Svg>
)
export const Bell = (p) => (
  <Svg {...p}>
    <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </Svg>
)
export const BookOpen = (p) => (
  <Svg {...p}>
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </Svg>
)
export const Bookmark = (p) => (
  <Svg {...p}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </Svg>
)
export const Camera = (p) => (
  <Svg {...p}>
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </Svg>
)
export const Check = (p) => (
  <Svg {...p}>
    <path d="M20 6L9 17l-5-5" />
  </Svg>
)
export const CheckCircle = (p) => (
  <Svg {...p}>
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <path d="M22 4L12 14.01l-3-3" />
  </Svg>
)
export const CheckSquare = (p) => (
  <Svg {...p}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </Svg>
)
export const ChevronDown = (p) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
)
export const ChevronLeft = (p) => (
  <Svg {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
)
export const ChevronRight = (p) => (
  <Svg {...p}>
    <path d="M9 18l6-6-6-6" />
  </Svg>
)
export const ChevronUp = (p) => (
  <Svg {...p}>
    <path d="M18 15l-6-6-6 6" />
  </Svg>
)
export const Circle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
  </Svg>
)
export const Clipboard = (p) => (
  <Svg {...p}>
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </Svg>
)
export const Clock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Svg>
)
export const Cloud = (p) => (
  <Svg {...p}>
    <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
  </Svg>
)
export const CloudOff = (p) => (
  <Svg {...p}>
    <path d="M22.61 16.95A5 5 0 0018 10h-1.26a8 8 0 00-7.05-6M5 5a8 8 0 004 15h9a5 5 0 001.7-.3" />
    <path d="M1 1l22 22" />
  </Svg>
)
export const Copy = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </Svg>
)
export const Cpu = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
  </Svg>
)
export const CreditCard = (p) => (
  <Svg {...p}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <path d="M1 10h22" />
  </Svg>
)
export const Crosshair = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M22 12h-4M6 12H2M12 6V2M12 22v-4" />
  </Svg>
)
/** Feather `edit` —— 方框＋鉛筆。Figma 蒐證清單「文字紀錄」用的就是這顆 */
export const Edit = (p) => (
  <Svg {...p}>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
)
/** Feather `edit-2` —— 純鉛筆 */
export const Edit2 = (p) => (
  <Svg {...p}>
    <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Svg>
)
/** Feather `edit-3` —— 鋼筆＋底線 */
export const Edit3 = (p) => (
  <Svg {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </Svg>
)
export const ExternalLink = (p) => (
  <Svg {...p}>
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <path d="M15 3h6v6M10 14L21 3" />
  </Svg>
)
export const Eye = (p) => (
  <Svg {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
)
export const EyeOff = (p) => (
  <Svg {...p}>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <path d="M1 1l22 22" />
  </Svg>
)
export const FileText = (p) => (
  <Svg {...p}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </Svg>
)
export const Flag = (p) => (
  <Svg {...p}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <path d="M4 22v-7" />
  </Svg>
)
export const Globe = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </Svg>
)
export const Grid = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </Svg>
)
/** Feather `image` —— Figma 的「瀏覽照片」工具與「已有照片」action 都是這顆 */
export const Image = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </Svg>
)
/** 舊名相容：Figma 沒有複數版 images，一律指向 `image` */
export const Images = Image
export const Info = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </Svg>
)
export const Layout = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <path d="M3 9h18M9 21V9" />
  </Svg>
)
export const List = (p) => (
  <Svg {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </Svg>
)
export const Lock = (p) => (
  <Svg {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </Svg>
)
export const Map = (p) => (
  <Svg {...p}>
    <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
    <path d="M8 2v16M16 6v16" />
  </Svg>
)
export const MapPin = (p) => (
  <Svg {...p}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
)
export const Maximize2 = (p) => (
  <Svg {...p}>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </Svg>
)
export const MessageCircle = (p) => (
  <Svg {...p}>
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8z" />
  </Svg>
)
export const MessageSquare = (p) => (
  <Svg {...p}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </Svg>
)
export const Mic = (p) => (
  <Svg {...p}>
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
  </Svg>
)
export const MoreHorizontal = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </Svg>
)
export const Move = (p) => (
  <Svg {...p}>
    <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
  </Svg>
)
export const Pause = (p) => (
  <Svg {...p}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </Svg>
)
export const Play = (p) => (
  <Svg {...p}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </Svg>
)
export const Plus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)
export const PlusCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </Svg>
)
export const Printer = (p) => (
  <Svg {...p}>
    <path d="M6 9V2h12v7" />
    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </Svg>
)
export const RefreshCw = (p) => (
  <Svg {...p}>
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </Svg>
)
export const RotateCcw = (p) => (
  <Svg {...p}>
    <path d="M1 4v6h6" />
    <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
  </Svg>
)
export const Search = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </Svg>
)
export const Shield = (p) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
)
export const Square = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </Svg>
)
export const Star = (p) => (
  <Svg {...p}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Svg>
)
/** Figma 的「結束錄音」用的是 stop-circle，不是 square */
export const StopCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" />
  </Svg>
)
export const Tag = (p) => (
  <Svg {...p}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <path d="M7 7h.01" />
  </Svg>
)
export const Target = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </Svg>
)
export const ThumbsUp = (p) => (
  <Svg {...p}>
    <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
  </Svg>
)
export const Trash = (p) => (
  <Svg {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
)
export const User = (p) => (
  <Svg {...p}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
)
export const Users = (p) => (
  <Svg {...p}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </Svg>
)
export const X = (p) => (
  <Svg {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Svg>
)
export const Zap = (p) => (
  <Svg {...p}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Svg>
)

/* ═══════════════ 非 Feather —— 專案自訂 ═══════════════
   Feather 沒有這幾顆，維持自繪，但沿用同一套幾何規則（24 網格 / stroke 2 / round）。
   若之後 Figma 補上對應 component，回頭換掉。 */

/** AI 語意專用（Figma 用紫色 AI 徽章搭配，Feather 無對應） */
export const Sparkles = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
    <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </Svg>
)
export const PawPrint = (p) => (
  <Svg {...p}>
    <circle cx="7" cy="8" r="1.8" />
    <circle cx="12" cy="6" r="1.8" />
    <circle cx="17" cy="8" r="1.8" />
    <path d="M12 11c-2.5 0-4.5 2-4.5 4.2 0 1.6 1.2 2.8 2.8 2.8h3.4c1.6 0 2.8-1.2 2.8-2.8C16.5 13 14.5 11 12 11z" />
  </Svg>
)
export const IdCard = (p) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <circle cx="8" cy="11" r="2" />
    <path d="M5 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h5M14 14h3" />
  </Svg>
)
export const Notebook = (p) => (
  <Svg {...p}>
    <path d="M5 3h13a1 1 0 011 1v16a1 1 0 01-1 1H5z" />
    <path d="M5 7H3M5 12H3M5 17H3M10 8h5M10 12h5" />
  </Svg>
)
export const GripVertical = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="6" r="1.3" />
    <circle cx="9" cy="12" r="1.3" />
    <circle cx="9" cy="18" r="1.3" />
    <circle cx="15" cy="6" r="1.3" />
    <circle cx="15" cy="12" r="1.3" />
    <circle cx="15" cy="18" r="1.3" />
  </Svg>
)
export const Signature = (p) => (
  <Svg {...p}>
    <path d="M3 17c3 0 3-9 6-9s2 9 5 9 3-5 5-5" />
    <path d="M3 21h18" />
  </Svg>
)
export const Scan = (p) => (
  <Svg {...p}>
    <path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
    <path d="M4 12h16" />
  </Svg>
)
