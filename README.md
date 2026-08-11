# 外勤小助手 · 第三版高保真原型

> 2026-08-11 建立。取代 `08_第二版網頁原型/`（第二版視覺與 Figma 落差太大，已停用但保留對照）。

## 這是什麼

Figma「動保 Design System」外勤小助手 **F0–F16 全部 15 個畫面**的可點擊高保真原型。
給老師與工研院 demo，實際在 **iPad 橫向**上操作。純前端假資料，沒有後端、沒有真的 AI API。

## 怎麼打開來看

**最快**：雙擊 `demo/index.html`，用瀏覽器開就能跑（離線也行）。
建議把瀏覽器視窗調成接近 **1194×834**（iPad 11" 橫向）再 demo。

首頁 `#/index` 是頁面地圖，可以直接跳到任一畫面；也可以從 F0 登入開始走完整動線。

## 建議的 demo 動線

```
F0 登入 → F1 今日行程（點案件）→ F2 出勤前預覽（出勤開始）
   → F3 工作台：按「開始錄音」，逐字稿會一句一句長出來
        ↳ 講到關鍵詞時 F11 彈窗自動跳出 → 按保存 → checklist 自動打勾
        ↳ 左側工具列：F5 掃身分證（OCR）→ F6 寵物查詢（身分證自動帶入）
        ↳ checklist 的相機圖示 → F10 拍照 → 拍完 F7 照片頁真的多一張
        ↳ 切「AI 整理摘要」分頁看 F4；開筆記本看 F8
   → 完成現場紀錄 → F12 整案 AI 摘要
   → 開立 F13 案件紀錄單（附件清單會反映你前面真的做了什麼）
   → 需要時開立 F14 限期改善單 / F15 拾獲單 / F16 扣留單
```

**跨頁狀態是真的串起來的**：拍的照片會進 F7 與 F13、checklist 勾選會帶到 F12、
F14 開立後會出現在 F13 的附件清單。重新整理會歸零（刻意的，方便重跑 demo）。

## 技術

- Vite + React 19 + Tailwind v4，hash routing，零後端
- design tokens 直接取自 Figma variables（`src/styles/tokens.css`），主色 `Field/600 #1F706B`
- 字體 Noto Sans TC 自架（不走 Google Fonts CDN，現場沒網路也不會掉字）
- 所有照片／地圖／街景都是 CSS 漸層＋inline SVG 自繪，不引任何外部圖片

## 資料夾

```
src/
  styles/tokens.css      design tokens（改色階前先回 Figma 確認）
  components/ui.jsx      Button / Input / Checkbox / Card / Badge / AiBadge / Modal / Placeholder
  components/icons.jsx   lucide 風格 inline SVG
  store/AppState.jsx     全域狀態（案件、checklist、照片、逐字稿、筆記、單據）
  router.jsx             hash router
  screens/               F0–F16，一個畫面一個檔
_build/
  AGENT_BRIEF.md         要再加畫面時，交辦給 agent 的規範（含 Figma node ID 與驗收流程）
  INVENTORY.md           F0–F16 對照 Figma page node ID
  shot.mjs               逐頁截圖工具（跟 Figma 原稿並排比對用）
  setup-sandbox.sh       新 session 的環境重建腳本
demo/                    build 產物，可直接雙擊開啟
```

## 上線（Vercel）

repo 已備妥可直接 `git push` 後在 Vercel 連 repo 部署：framework 自動偵測 Vite，
build command `vite build`、output directory `dist`，不需要額外設定環境變數。

`demo/`（本機 build 產物，供離線雙擊使用）與 `dist/` 都已加進 `.gitignore`，不會進 repo；
Vercel 會自己重新 build 一份，兩邊不衝突。

## 要改東西的話

改 `src/` 後重新 build：

```bash
cd 09_第三版原型_外勤
npx vite build --outDir demo-new     # 注意：這個資料夾是 Synology 同步的，不能覆寫既有資料夾
```

新 session 要重建 sandbox 環境（node_modules、chromium、截圖工具）請跑 `_build/setup-sandbox.sh`。

## 已知限制

- 照片是示意圖，不是真實拍攝的案件照片
- F6 寵物查詢**仍是舊版晶片掃描流程** —— Figma 稿面本身還沒改成線上寵登，
  但完整的寵登欄位已經寫進 `state.petRecord`，Figma 補畫後接上即可
- F13/F14/F15/F16 的「預覽正式 PDF」只是示意，不會真的產生 PDF
- 逐字稿是預先寫好的腳本，不是真的語音辨識
