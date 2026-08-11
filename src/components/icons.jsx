/*
  圖示 — lucide 風格自繪 inline SVG，24px 網格、stroke=currentColor、strokeWidth 2。
  Figma 用的是 lucide icon set，命名沿用 lucide 名稱方便對照。
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

export const Shield = (p) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
export const ChevronDown = (p) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
)
export const Cloud = (p) => (
  <Svg {...p}>
    <path d="M17.5 19a4.5 4.5 0 000-9 6 6 0 00-11.6 1.6A3.5 3.5 0 006.5 19z" />
  </Svg>
)
export const CloudOff = (p) => (
  <Svg {...p}>
    <path d="M17.5 19a4.5 4.5 0 001.9-8.6M9 5.5A6 6 0 0117.4 9M6.5 19a3.5 3.5 0 01-.6-6.9M2 2l20 20" />
  </Svg>
)
export const IdCard = (p) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <circle cx="8" cy="11" r="2" />
    <path d="M5 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h5M14 14h3" />
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
export const Images = (p) => (
  <Svg {...p}>
    <rect x="3" y="6" width="14" height="12" rx="2" />
    <path d="M7 18l3.5-4 2.5 3 2-2.2 2 3.2M21 8v8a2 2 0 01-2 2" />
  </Svg>
)
export const FileText = (p) => (
  <Svg {...p}>
    <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V7z" />
    <path d="M14 2v5h5M9 13h6M9 17h4" />
  </Svg>
)
export const Notebook = (p) => (
  <Svg {...p}>
    <path d="M5 3h13a1 1 0 011 1v16a1 1 0 01-1 1H5z" />
    <path d="M5 7H3M5 12H3M5 17H3M10 8h5M10 12h5" />
  </Svg>
)
export const Camera = (p) => (
  <Svg {...p}>
    <path d="M3 8h3.5L8 5.5h8L17.5 8H21a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
)
export const Mic = (p) => (
  <Svg {...p}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0014 0M12 18v4" />
  </Svg>
)
export const Play = (p) => (
  <Svg {...p}>
    <path d="M7 4l13 8-13 8z" fill="currentColor" />
  </Svg>
)
export const Pause = (p) => (
  <Svg {...p}>
    <rect x="7" y="4" width="4" height="16" rx="1" fill="currentColor" />
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
  </Svg>
)
export const Square = (p) => (
  <Svg {...p}>
    <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
  </Svg>
)
export const Flag = (p) => (
  <Svg {...p}>
    <path d="M5 21V4h13l-2.5 4L18 12H5" />
  </Svg>
)
export const Check = (p) => (
  <Svg {...p}>
    <path d="M20 6L9 17l-5-5" />
  </Svg>
)
export const CheckCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </Svg>
)
export const Circle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
  </Svg>
)
export const AlertTriangle = (p) => (
  <Svg {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4M12 17.5v.01" />
  </Svg>
)
export const MapPin = (p) => (
  <Svg {...p}>
    <path d="M12 22s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="11" r="2.5" />
  </Svg>
)
export const Clock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </Svg>
)
export const Bell = (p) => (
  <Svg {...p}>
    <path d="M18 9a6 6 0 10-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.5 20a2 2 0 003 0" />
  </Svg>
)
export const Search = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </Svg>
)
export const Plus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)
export const Trash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </Svg>
)
export const Edit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L20 8l-4-4L4 16z" />
  </Svg>
)
export const Lock = (p) => (
  <Svg {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 018 0v3" />
  </Svg>
)
export const AlignLeft = (p) => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h11M4 18h14" />
  </Svg>
)
export const Sparkles = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
    <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </Svg>
)
export const X = (p) => (
  <Svg {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Svg>
)
export const ArrowRight = (p) => (
  <Svg {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </Svg>
)
export const ChevronUp = (p) => (
  <Svg {...p}>
    <path d="M6 15l6-6 6 6" />
  </Svg>
)
export const ArrowLeft = (p) => (
  <Svg {...p}>
    <path d="M20 12H4M10 6l-6 6 6 6" />
  </Svg>
)
export const MoreHorizontal = (p) => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" />
  </Svg>
)
export const GripVertical = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="6" r="1.3" fill="currentColor" />
    <circle cx="9" cy="12" r="1.3" fill="currentColor" />
    <circle cx="9" cy="18" r="1.3" fill="currentColor" />
    <circle cx="15" cy="6" r="1.3" fill="currentColor" />
    <circle cx="15" cy="12" r="1.3" fill="currentColor" />
    <circle cx="15" cy="18" r="1.3" fill="currentColor" />
  </Svg>
)
export const Maximize2 = (p) => (
  <Svg {...p}>
    <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />
  </Svg>
)
export const Map = (p) => (
  <Svg {...p}>
    <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14M15 6v14" />
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
export const User = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
  </Svg>
)
