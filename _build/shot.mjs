/*
  逐頁截圖 — 給「跟 Figma 原稿並排比對」用的驗收工具。
  用法（在 sandbox）：
    node _build/shot.mjs f0 f1 f3        # 指定路由
    node _build/shot.mjs --all           # 全部路由
  輸出：/tmp/shots/<route>.png，尺寸固定 1194x834（= Figma frame 尺寸）

  ⚠️ sandbox 缺 libXdamage.so.1 且無 root。_build/setup-sandbox.sh 會編一個
  stub .so 補上；跑本腳本前先 source 它，否則 chromium 會以 exit 127 死掉。
*/
import { chromium } from '/tmp/plw/node_modules/playwright/index.mjs'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const DIST = process.env.DIST || '/tmp/dist'
const OUT = process.env.OUT || '/tmp/shots'
const WIDTH = 1194
const HEIGHT = 834

const ALL = [
  'index', 'f0', 'f1', 'f2', 'f3', 'f5', 'f6', 'f7',
  'f9', 'f10', 'f12', 'f13', 'f14', 'f15', 'f16',
]

const args = process.argv.slice(2)
const routes = args.length === 0 || args.includes('--all')
  ? ALL
  : args.filter((a) => !a.startsWith('--'))

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json',
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  let file = resolve(join(DIST, decodeURIComponent(url.pathname)))
  if (!file.startsWith(resolve(DIST))) return res.writeHead(403).end()
  if (!existsSync(file) || url.pathname === '/') file = join(DIST, 'index.html')
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end()
  }
})

await new Promise((r) => server.listen(0, r))
const port = server.address().port

const browser = await chromium.launch({ chromiumSandbox: false })
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 2, // 對照 Figma 2x 輸出，看得出 1px 落差
})

await import('node:fs').then((fs) => fs.mkdirSync(OUT, { recursive: true }))

for (const route of routes) {
  await page.goto(`http://localhost:${port}/index.html#/${route}`, {
    waitUntil: 'networkidle',
  })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(250)
  const path = join(OUT, `${route}.png`)
  await page.screenshot({ path })
  console.log('shot', route, '→', path)
}

await browser.close()
server.close()
