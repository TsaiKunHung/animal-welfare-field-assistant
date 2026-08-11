import { useEffect, useState, useCallback } from 'react'

/*
  Hash router — 刻意不用 history API：
  1) build 後可直接 file:// 開啟（筆電離線 demo 備援）
  2) 部署到任何靜態主機都不需要 rewrite 規則
*/

export function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '') || 'f0'
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onHash = () => setRoute(read())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return route
}

export function navigate(to) {
  window.location.hash = `/${to}`
}

export function useNavigate() {
  return useCallback(navigate, [])
}

export function Link({ to, children, className, onClick, ...rest }) {
  return (
    <a
      href={`#/${to}`}
      className={className}
      onClick={(e) => {
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
