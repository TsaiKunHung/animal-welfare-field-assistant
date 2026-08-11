# AGENT_BRIEF — 刻一個外勤畫面前必讀

> 每個 page-builder subagent 進來第一件事就是讀本檔。違反這裡的規則，驗收不會過。

## 專案是什麼

政府動保專案（農業部→工研院→IUI Lab）「外勤小助手」的第三版高保真點擊原型，
給老師與工研院 demo，實際會在 **iPad 橫向（1194×834）** 上點。
純前端假資料，沒有後端、沒有真的 AI API。使用者角色：陳建宏 動檢員／新北市動物保護處。

設計來源：Figma「動保 Design System」fileKey `vF2gxLFZ4nTUKTERW3xDyV`，外勤 F0–F16。

**這一版存在的唯一理由是「上一版視覺不像 Figma」。所以「像不像」就是驗收標準，
功能對但版型走鐘＝沒做完。**

## 專案路徑與檔案分工

專案根目錄：`/sessions/serene-jolly-hawking/mnt/動保AI agent/09_第三版原型_外勤`

```
src/
  styles/tokens.css      ← design tokens（唯讀，不要改）
  components/ui.jsx      ← Button / Input / Checkbox / Card / Badge / AiBadge / Modal / Placeholder（唯讀）
  components/icons.jsx   ← lucide 風格 inline SVG（可新增圖示，不要改既有的）
  store/AppState.jsx     ← 全域狀態（唯讀，需要新 action 請回報）
  router.jsx             ← hash router：navigate('f3') / <Link to="f3">
  screens/Fx*.jsx        ← 你只寫自己那一個
App.jsx                  ← 路由表（已經寫好，不要改）
```

**你只能新增／覆寫自己負責的 `src/screens/` 檔案。**
其他檔案一律唯讀 —— 需要修改請在回報裡寫清楚要改什麼、為什麼，由主 session 統一處理。
（多個 subagent 同時改同一個共用檔會互相覆蓋。）

## 必走的流程

1. `get_figma_skill("skill://figma/figma-design-to-code/SKILL.md")` 先讀，這是 MCP 規定的前置。
2. `get_metadata(fileKey, nodeId=<你的 page id>)` 看這個 page 有幾個 frame、各自是什麼子畫面。
3. 對**每個** frame 跑 `get_design_context(fileKey, nodeId=<frame id>, skillNames="resource:figma-design-to-code")`。
   回傳的是 React + Tailwind 參考碼 —— 本專案就是 React + Tailwind v4，
   所以 **class 幾乎可以直接沿用**，這是這次能做到「像」的關鍵，不要自己重新想版型。
4. 寫進 `src/screens/<你的檔案>.jsx`。
5. **截圖比對驗收**（見下），不像就改，改到像為止。
6. 回報。

## 寫碼規則

- 顏色/字級/圓角一律用 tokens 對應的 Tailwind class：
  `bg-field-600` `text-field-700` `border-hairline` `text-ink` `text-ink-sub` `bg-canvas`
  `text-neutral-500` `rounded-md`(8) `rounded-xl`(16) `shadow-xs/sm/md/lg`。
  **不要寫死 hex**（示意插圖、地圖漸層除外）。
- 參考碼裡的 `#1f706b` → `bg-field-600`；`#175b57` → `text-field-700`；
  `#181d27` → `text-ink`；`#535862` → `text-ink-sub`；`#eaecf0` → `border-hairline`；
  `#d4d4d4` → `border-neutral-300`；`#737373` → `text-neutral-500`；`#404040` → `text-neutral-700`。
- 既有元件優先用 `components/ui.jsx`，不要自己再刻一顆按鈕。
- 圖示用 `components/icons.jsx`；缺的自己在該檔**新增**（24px 網格、stroke currentColor、strokeWidth 2），
  不要改動或刪除既有 export，也不要引外部 icon 套件。
- 照片／地圖／街景一律用 `<Placeholder>` 或 CSS 漸層 + inline SVG，**不要引用外部圖片網址**
  （Figma 的 asset URL 七天就過期，離線 demo 也會掛）。
- 子畫面／彈窗／狀態機（例如 F6 的多個掃描狀態）寫在同一個 screen 檔裡用 `useState` 切換，
  不要另開路由 —— 與 Figma 的 frame 分組一致。
- 版型用 flex/grid，**不要用絕對定位堆整頁**。參考碼的 `absolute inset-[...]` 只在真的疊圖時才保留。
- 高度處理：`h-full` + flex column，頂欄 72px 固定、底部錄音列 80px 固定、中間 `flex-1 min-h-0 overflow-auto`。
  **不要寫死 `h-[834px]`** —— iPad Safari 的可視高度會比 834 小，寫死會被裁掉。
- 捲動容器加 `scroll-thin` class。
- 假資料優先從 `useApp()` 的全域 state 取（案件、checklist、照片、逐字稿、筆記）。
  畫面專屬的靜態文案可以寫在檔案內的常數。

## 互動要求（demo 點得下去才算數）

每個畫面至少要能：
- 主要按鈕真的會導到下一頁（用 `navigate('f12')` 這種）。
- 有分頁的真的能切；有彈窗的真的能開關；有勾選的真的能勾。
- 表單欄位可輸入（`useState` 即可，不要用 localStorage）。
- 死路要補：找不到去處的返回鍵至少導回上一頁或 `f1`。

## 截圖比對驗收（不做這步等於沒做完）

```bash
export PLAYWRIGHT_BROWSERS_PATH=/tmp/plw/browsers
export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
export LD_LIBRARY_PATH=/tmp/stublib
cd "/sessions/serene-jolly-hawking/mnt/動保AI agent/09_第三版原型_外勤"
npx vite build --outDir /tmp/dist-<你的代號> 2>&1 | tail -3
DIST=/tmp/dist-<你的代號> OUT=/tmp/shots-<你的代號> node _build/shot.mjs <route>
cp /tmp/shots-<你的代號>/<route>.png "/sessions/serene-jolly-hawking/mnt/outputs/<route>-shot.png"
```

然後用 **Read 工具**打開 `/Users/kunhung/Library/Application Support/Claude/local-agent-mode-sessions/fd3e1901-3e60-4722-a465-14c40b2068b2/ad16f9b8-808c-46c2-af80-c4665078eea4/local_30219697-5647-45e1-8af5-233a013f836a/outputs/<route>-shot.png`
把它跟 `get_design_context` 回傳的 Figma 截圖並排看，逐項檢查：

- [ ] 整體分欄比例、左右欄寬
- [ ] 卡片圓角、描邊、陰影強度
- [ ] 字級與字重階層（標題/內文/註解有沒有拉開）
- [ ] 間距節奏（有沒有整體太鬆或太擠）
- [ ] 主色使用位置（哪裡該是 field-600、哪裡只是灰）
- [ ] 圖示風格與大小

有落差就改，重跑上面指令再看一次。**至少要跑兩輪**（第一次幾乎不會一次到位）。

## 已知環境坑

- 這個資料夾是 Synology 同步的：bash **不能刪除或覆寫既有檔案**（EPERM）。
  - 新檔案可以寫。要覆寫既有檔案，用 **Write 工具**，不要用 bash 重導向。
  - build 一律輸出到 `/tmp/dist-*`，不要輸出到專案內。
- `node_modules` 是指到 `/tmp/nm/node_modules` 的 symlink。不要在專案裡跑 `npm i`
  （npm 會想刪掉那個 symlink 然後失敗）；要裝套件請回報，不要自己裝。
- Figma MCP 需要使用者的 Figma 桌面版開著該檔案。若回傳 0×0 空 canvas 或找不到 node，
  不要猜、不要硬幹，直接回報。

## 前人踩過的坑（一定要看）

- **`get_metadata` 對大 page 會失敗**（SSE 在 ~86KB 被截斷，重試沒用，例如 F2 page）。
  遇到就改用 `use_figma` 跑一段唯讀腳本列出 page 的 children 拿 frame ID，
  再逐個 frame 跑 `get_design_context`。不要因此放棄或改用猜的。
- **不要引用 Figma 回傳的 asset URL**（7 天過期、sandbox 也連不到 figma.com）。
  照片/地圖/街景一律 `<Placeholder>` 或 CSS 漸層 + inline SVG 自繪。
- **Figma 稿本身有不少舊版殘留**：重複疊圖層、frame 命名沒改（彈窗全叫「飼主身分查詢對話框」）、
  台北市/新北市地址混用、日期 2025 與民國 115 年混用、法條文案兩條黏在一起。
  遇到明顯錯的，**照專案設定修正**（新北市、民國 115 年、案件資料以 `state.activeCase` 為準），
  並在回報第 4 點寫出來。不要照抄明顯的錯誤。
- `icons.jsx` 已有：Shield ChevronLeft/Right/Down/Up ArrowLeft/Right Cloud CloudOff IdCard PawPrint
  Images FileText Notebook Camera Mic Play Pause Square Flag Check CheckCircle Circle
  AlertTriangle MapPin Clock Bell Search Plus Trash Edit Lock AlignLeft Sparkles X User
  MoreHorizontal GripVertical Maximize2 Map Signature Scan。先查有沒有再自己畫。
- 選取／強調狀態一律用 `border-field-600` 或 `ring-field-600`，**不要用藍色**（藍色不在 tokens 裡）。

## 回報格式

1. 做了哪些 frame（Figma frame 名 → 實作成什麼：分頁/彈窗/狀態）
2. 截圖比對做了幾輪、最後還剩哪些**已知落差**（誠實寫，不要說「完全一致」）
3. 需要主 session 處理的共用檔修改（store action、ui 元件、路由）
4. Figma 稿面本身的問題（缺畫面、與其他頁不一致、明顯是舊版殘留）
