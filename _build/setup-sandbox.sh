#!/usr/bin/env bash
# 每個新 session 都要先跑一次（sandbox 是暫時的，重開就沒了）。
# 做三件事：1) 共用 node_modules 2) playwright chromium 3) libXdamage stub
set -e

PROJ="/sessions/serene-jolly-hawking/mnt/動保AI agent/09_第三版原型_外勤"

# 1) node_modules 放 /tmp，不要放在 Synology 同步資料夾裡（會同步兩萬個檔案）
mkdir -p /tmp/nm/node_modules
[ -f /tmp/nm/package.json ] || echo '{"name":"nm","private":true}' > /tmp/nm/package.json
[ -e "$PROJ/node_modules" ] || ln -s /tmp/nm/node_modules "$PROJ/node_modules"
cd /tmp/nm && npm i react react-dom @fontsource/noto-sans-tc \
  vite @vitejs/plugin-react tailwindcss @tailwindcss/vite --silent

# 2) playwright + chromium
npm i -D playwright --prefix /tmp/plw --silent
export PLAYWRIGHT_BROWSERS_PATH=/tmp/plw/browsers
/tmp/plw/node_modules/.bin/playwright install chromium || true   # 依賴檢查會失敗，忽略

# 3) libXdamage stub —— sandbox 沒有 root 裝不了 libxdamage1，
#    但 headless chromium 只 import 四個符號且在 headless 下不會呼叫，補空實作即可。
mkdir -p /tmp/stublib
cat > /tmp/stublib/xdamage_stub.c <<'EOF'
typedef unsigned long XID;
typedef void Display;
int XDamageQueryExtension(Display *d, int *e, int *r) { if(e)*e=0; if(r)*r=0; return 0; }
XID XDamageCreate(Display *d, XID w, int l) { (void)d;(void)w;(void)l; return 0; }
void XDamageDestroy(Display *d, XID x) { (void)d;(void)x; }
void XDamageSubtract(Display *d, XID a, XID b, XID c) { (void)d;(void)a;(void)b;(void)c; }
EOF
gcc -shared -fPIC -o /tmp/stublib/libXdamage.so.1 /tmp/stublib/xdamage_stub.c

cat <<'MSG'

setup 完成。之後每次要截圖：

  export PLAYWRIGHT_BROWSERS_PATH=/tmp/plw/browsers
  export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
  export LD_LIBRARY_PATH=/tmp/stublib
  cd "$PROJ" && npx vite build --outDir /tmp/dist --emptyOutDir && node _build/shot.mjs --all

MSG
