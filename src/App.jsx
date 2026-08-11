import { useRoute } from './router.jsx'

import F0Login from './screens/F0Login.jsx'
import F1DayRoute from './screens/F1DayRoute.jsx'
import F2CasePreview from './screens/F2CasePreview.jsx'
import F3Workbench from './screens/F3Workbench.jsx'
import F5OwnerId from './screens/F5OwnerId.jsx'
import F6PetQuery from './screens/F6PetQuery.jsx'
import F7Photos from './screens/F7Photos.jsx'
import F9CaseContent from './screens/F9CaseContent.jsx'
import F10Camera from './screens/F10Camera.jsx'
import F12AiSummary from './screens/F12AiSummary.jsx'
import F13RecordForm from './screens/F13RecordForm.jsx'
import F14ImprovementNotice from './screens/F14ImprovementNotice.jsx'
import F15FoundForm from './screens/F15FoundForm.jsx'
import F16DetentionForm from './screens/F16DetentionForm.jsx'
import Index from './screens/Index.jsx'

/*
  F4 (AI 整理摘要)、F8 (筆記本)、F11 (關鍵詞確認彈窗) 不是獨立路由，
  它們是 F3 工作台裡的分頁 / 面板 / 彈窗 —— 與 Figma 的資訊架構一致。
*/
const routes = {
  index: Index,
  f0: F0Login,
  f1: F1DayRoute,
  f2: F2CasePreview,
  f3: F3Workbench,
  f5: F5OwnerId,
  f6: F6PetQuery,
  f7: F7Photos,
  f9: F9CaseContent,
  f10: F10Camera,
  f12: F12AiSummary,
  f13: F13RecordForm,
  f14: F14ImprovementNotice,
  f15: F15FoundForm,
  f16: F16DetentionForm,
}

export default function App() {
  const route = useRoute()
  const Screen = routes[route] ?? F0Login

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas">
      <Screen />
    </div>
  )
}
