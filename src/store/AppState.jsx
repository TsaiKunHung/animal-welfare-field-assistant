import { createContext, useContext, useMemo, useReducer } from 'react'

/*
  全域狀態 — 這一版的重點：狀態必須貫穿整條動線。
  F3 拍的照片會出現在 F7；checklist 勾選會帶到 F12 摘要；F12 摘要與各項產出會
  變成 F13 案件紀錄單的附件清單。任何畫面都不該自己另存一份 local mock。
*/

const initialState = {
  user: { name: '陳建宏', title: '動檢員', org: '新北市動物保護處', signedIn: false },

  // 當前案件（假資料，來源：Figma F1/F2 稿面文案）
  activeCase: {
    id: 'AC-1150811-003',
    title: '文化路米克斯犬｜板橋區',
    type: '不當飼養',
    priority: 'urgent',
    reportedAt: '115/08/11 09:24',
    address: '新北市板橋區文化路一段 188 巷 12 號',
    reporter: {
      name: '王小姐',
      phone: '0912-345-678',
      channel: '1959 平台',
      anonymous: false,
    },
    description:
      '鄰居反映該戶飼養之犬隻長期關在陽台鐵籠，未提供遮蔽與飲水，近日叫聲異常虛弱。',
    summary:
      '不當飼養案件，地點位於住宅區，動物疑似處於不良環境，需現場勘查居住空間及寵物健康狀態，避免動物持續受苦並維護社區安寧。',
    animal: { species: '犬', count: 1, breed: '米克斯', gender: '公' },
  },

  // F3 錄音與逐字稿
  recording: { status: 'idle', elapsed: 0 }, // idle | recording | paused | done
  transcript: [], // { t, speaker, text, marked }

  // F3 evidence checklist（三大類，來源 Figma F3）
  checklist: [
    { id: 'env-1', group: '環境紀錄', label: '拍攝飼養場所整體環境', done: false, photos: [] },
    { id: 'env-2', group: '環境紀錄', label: '記錄遮蔽、通風與衛生狀況', done: false, photos: [] },
    { id: 'env-3', group: '環境紀錄', label: '拍攝飲水與食物供給情形', done: false, photos: [] },
    { id: 'ani-1', group: '動物狀況', label: '拍攝動物全身與特徵', done: false, photos: [] },
    { id: 'ani-2', group: '動物狀況', label: '記錄動物的活動力與精神狀態', done: false, photos: [] },
    { id: 'ani-3', group: '動物狀況', label: '確認是否有外傷或疾病徵狀', done: false, photos: [] },
    { id: 'own-1', group: '飼主資訊', label: '確認飼主身分與聯絡方式', done: false, photos: [] },
    { id: 'own-2', group: '飼主資訊', label: '查詢寵物登記與晶片資料', done: false, photos: [] },
  ],

  notes: [], // F8 筆記本
  photos: [], // { id, category, label, checklistId, tags: [] }
  ownerId: null, // F5 OCR 結果
  petRecord: null, // F6 寵物登記查詢結果
  aiSummary: null, // F12 產出
  documents: [], // F13 / F14 / F15 / F16 開立的單據
}

function reducer(state, action) {
  switch (action.type) {
    case 'SIGN_IN':
      return { ...state, user: { ...state.user, signedIn: true } }
    case 'SIGN_OUT':
      return { ...state, user: { ...state.user, signedIn: false } }

    case 'SET_RECORDING':
      return { ...state, recording: { ...state.recording, ...action.payload } }
    case 'PUSH_TRANSCRIPT':
      return { ...state, transcript: [...state.transcript, action.payload] }
    case 'UPDATE_TRANSCRIPT':
      return {
        ...state,
        transcript: state.transcript.map((s, i) =>
          i === action.index ? { ...s, ...action.payload } : s,
        ),
      }

    case 'TOGGLE_CHECK':
      return {
        ...state,
        checklist: state.checklist.map((c) =>
          c.id === action.id ? { ...c, done: action.done ?? !c.done } : c,
        ),
      }
    case 'ADD_CHECK_ITEM':
      return { ...state, checklist: [...state.checklist, action.payload] }

    case 'ADD_NOTE':
      return { ...state, notes: [...state.notes, action.payload] }
    case 'REMOVE_NOTE':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) }

    case 'ADD_PHOTO': {
      const photo = action.payload
      return {
        ...state,
        photos: [...state.photos, photo],
        checklist: state.checklist.map((c) =>
          c.id === photo.checklistId
            ? { ...c, done: true, photos: [...c.photos, photo.id] }
            : c,
        ),
      }
    }
    case 'REMOVE_PHOTO':
      return { ...state, photos: state.photos.filter((p) => p.id !== action.id) }
    case 'TAG_PHOTO':
      return {
        ...state,
        photos: state.photos.map((p) =>
          p.id === action.id ? { ...p, tags: action.tags } : p,
        ),
      }

    case 'SET_OWNER_ID':
      return { ...state, ownerId: action.payload }
    case 'SET_PET_RECORD':
      return { ...state, petRecord: action.payload }
    case 'SET_AI_SUMMARY':
      return { ...state, aiSummary: action.payload }

    case 'ISSUE_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

const AppStateContext = createContext(null)

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const derived = useMemo(() => {
    const done = state.checklist.filter((c) => c.done).length
    return {
      checklistDone: done,
      checklistTotal: state.checklist.length,
      checklistComplete: done === state.checklist.length,
      // F13 附件清單 — 依實際做過什麼動態產生，不是寫死的六行
      attachments: [
        state.aiSummary && { key: 'summary', label: '現場紀錄 AI 摘要' },
        // 紀錄單本身：尚未正式開立前先以待開立狀態列出，開立後由 documents 那筆取代，避免同名重複
        !state.documents.some((d) => d.type === 'record') && {
          key: 'form',
          label: '外勤案件紀錄單',
        },
        state.photos.length > 0 && {
          key: 'photos',
          label: `案件照片（${state.photos.length} 張）`,
        },
        state.transcript.length > 0 && { key: 'transcript', label: '現場錄音與逐字稿' },
        state.petRecord && { key: 'chip', label: '寵物登記查詢結果紀錄' },
        ...state.documents.map((d) => ({ key: d.type, label: d.label })),
      ].filter(Boolean),
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch, ...derived }), [state, derived])
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useApp must be used inside <AppStateProvider>')
  return ctx
}
