const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

export function getWorkbenchBaseUrl() {
  const configured = import.meta.env.VITE_WORKBENCH_BASE_URL?.trim()
  if (configured) return trimTrailingSlash(configured)

  if (typeof window === "undefined") return "http://localhost:3000"

  const { protocol, hostname, port, origin } = window.location
  if ((hostname === "localhost" || hostname === "127.0.0.1") && port === "4444") {
    return `${protocol}//${hostname}:3000`
  }

  return trimTrailingSlash(origin)
}

export function getWorkbenchUrl(path = "/workspace") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return new URL(normalizedPath, `${getWorkbenchBaseUrl()}/`).toString()
}
