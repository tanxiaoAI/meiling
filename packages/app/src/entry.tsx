// @refresh reload

import * as Sentry from "@sentry/solid"
import { render } from "solid-js/web"
import { AppBaseProviders, AppInterface } from "@/app"
import { type Platform, PlatformProvider } from "@/context/platform"
import { dict as en } from "@/i18n/en"
import { dict as zh } from "@/i18n/zh"
import { handleNotificationClick } from "@/utils/notification-click"
import { hasPortalBridgeParams, loadPortalBridgeState, readPortalBridgeParams, savePortalBridgeState } from "@/utils/portal-bridge"
import { authFromToken } from "@/utils/server"
import pkg from "../package.json"
import { ServerConnection } from "./context/server"

const DEFAULT_SERVER_URL_KEY = "meiling.settings.dat:defaultServerUrl"
const SERVER_STATE_KEY = "meiling.global.dat:server"

const getLocale = () => {
  if (typeof navigator !== "object") return "en" as const
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const language of languages) {
    if (!language) continue
    if (language.toLowerCase().startsWith("zh")) return "zh" as const
  }
  return "en" as const
}

const getRootNotFoundError = () => {
  const key = "error.dev.rootNotFound" as const
  const locale = getLocale()
  return locale === "zh" ? (zh[key] ?? en[key]) : en[key]
}

const getStorage = (key: string) => {
  if (typeof localStorage === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const setStorage = (key: string, value: string | null) => {
  if (typeof localStorage === "undefined") return
  try {
    if (value !== null) {
      localStorage.setItem(key, value)
      return
    }
    localStorage.removeItem(key)
  } catch {
    return
  }
}

const readDefaultServerUrl = () => getStorage(DEFAULT_SERVER_URL_KEY)
const writeDefaultServerUrl = (url: string | null) => setStorage(DEFAULT_SERVER_URL_KEY, url)
const clearServerState = () => setStorage(SERVER_STATE_KEY, null)

const normalizeUrl = (value: string) => {
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

const isLoopbackHost = (host: string) => host === "localhost" || host === "127.0.0.1"

const resolveDevServerUrl = () => {
  const host = import.meta.env.VITE_OPENCODE_SERVER_HOST ?? "localhost"
  const configuredPort = import.meta.env.VITE_OPENCODE_SERVER_PORT?.trim()
  const currentHost = typeof location === "object" ? location.hostname : host
  const currentPort = typeof location === "object" ? location.port : ""

  if (currentPort === "4444" && isLoopbackHost(currentHost) && configuredPort === "4300") {
    return `http://${host}:4096`
  }

  return `http://${host}:${configuredPort || "4096"}`
}

const notify: Platform["notify"] = async (title, description, href) => {
  if (!("Notification" in window)) return

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission().catch(() => "denied")
      : Notification.permission

  if (permission !== "granted") return

  const inView = document.visibilityState === "visible" && document.hasFocus()
  if (inView) return

  const notification = new Notification(title, {
    body: description ?? "",
    icon: "/favicon-96x96-v3.png",
  })

  notification.onclick = () => {
    handleNotificationClick(href)
    notification.close()
  }
}

const openLink: Platform["openLink"] = (url) => {
  window.open(url, "_blank")
}

const back: Platform["back"] = () => {
  window.history.back()
}

const forward: Platform["forward"] = () => {
  window.history.forward()
}

const restart: Platform["restart"] = async () => {
  window.location.reload()
}

const root = document.getElementById("root")
if (!(root instanceof HTMLElement) && import.meta.env.DEV) {
  throw new Error(getRootNotFoundError())
}

const getCurrentUrl = () => {
  if (import.meta.env.DEV) {
    return resolveDevServerUrl()
  }
  return location.origin
}

const getDefaultUrl = () => {
  const lsDefault = readDefaultServerUrl()
  const currentUrl = getCurrentUrl()
  if (!lsDefault) return currentUrl

  if (import.meta.env.DEV) {
    const stored = normalizeUrl(lsDefault)
    const current = normalizeUrl(currentUrl)
    if (
      stored &&
      current &&
      isLoopbackHost(stored.hostname) &&
      isLoopbackHost(current.hostname) &&
      stored.port !== current.port
    ) {
      writeDefaultServerUrl(currentUrl)
      return currentUrl
    }
  }

  return lsDefault
}

const clearAuthToken = () => {
  const params = new URLSearchParams(location.search)
  if (!params.has("auth_token")) return
  params.delete("auth_token")
  params.delete("portal_display_name")
  params.delete("portal_email")
  params.delete("portal_base_url")
  params.delete("portal_logout_url")
  params.delete("portal_workspace_directory")
  params.delete("portal_pack_key")
  params.delete("portal_pack_name")
  params.delete("portal_pack_version")
  history.replaceState(null, "", location.pathname + (params.size ? `?${params}` : "") + location.hash)
}

const shouldRedirectToPortalLogin = () => {
  if (import.meta.env.DEV) return false
  if (new URLSearchParams(location.search).has("auth_token")) return false
  if (loadPortalBridgeState()) return false
  const configured = import.meta.env.VITE_PORTAL_BASE_URL?.trim()
  if (!configured) return false
  window.location.replace(new URL("/login", configured).toString())
  return true
}

const platform: Platform = {
  platform: "web",
  version: pkg.version,
  openLink,
  back,
  forward,
  restart,
  notify,
  getDefaultServer: async () => {
    const stored = readDefaultServerUrl()
    return stored ? ServerConnection.Key.make(stored) : null
  },
  setDefaultServer: writeDefaultServerUrl,
}

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE ?? `web@${pkg.version}`,
    initialScope: {
      tags: {
        platform: "web",
      },
    },
    integrations: (integrations) => {
      return integrations.filter(
        (i) =>
          i.name !== "Breadcrumbs" && !(import.meta.env.OPENCODE_CHANNEL === "prod" && i.name === "GlobalHandlers"),
      )
    },
  })
}

if (root instanceof HTMLElement) {
  if (shouldRedirectToPortalLogin()) {
    // Let the browser leave for the portal login page before booting the app shell.
  } else {
    const portalBridge = readPortalBridgeParams(location.search)
    const hasBridgeParams = hasPortalBridgeParams(location.search)
    // #region debug-point B:entry-bootstrap
    fetch("http://127.0.0.1:7780/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "login-freeze-crash",
        runId: "pre-fix",
        hypothesisId: "B",
        location: "vendor/opencode/packages/app/src/entry.tsx",
        msg: "[DEBUG] entry bootstrap",
        data: {
          href: location.href,
          hasBridgeParams,
          portalBridge,
          storedBridge: loadPortalBridgeState() ?? null,
          defaultUrl: getDefaultUrl(),
          currentUrl: getCurrentUrl(),
        },
        ts: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    if (hasBridgeParams) {
      clearServerState()
      savePortalBridgeState(portalBridge)
    }
    const effectivePortalBridge = hasBridgeParams ? portalBridge : loadPortalBridgeState() ?? portalBridge
    const auth = authFromToken(new URLSearchParams(location.search).get("auth_token"))
    clearAuthToken()
    const server: ServerConnection.Http = {
      type: "http",
      authToken: !!auth,
      displayName: effectivePortalBridge.displayName,
      http: {
        url: getCurrentUrl(),
        username: auth?.username || effectivePortalBridge.email,
        password: auth?.password,
      },
    }
    render(
      () => (
        <PlatformProvider value={platform}>
          <AppBaseProviders>
            <AppInterface
              defaultServer={ServerConnection.Key.make(getDefaultUrl())}
              canonicalLocalServer={ServerConnection.key(server)}
              servers={[server]}
              disableHealthCheck
            />
          </AppBaseProviders>
        </PlatformProvider>
      ),
      root,
    )
    // #region debug-point B:post-render-dom
    setTimeout(() => {
      const center = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      fetch("http://127.0.0.1:7780/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "login-freeze-crash",
          runId: "pre-fix",
          hypothesisId: "B",
          location: "vendor/opencode/packages/app/src/entry.tsx",
          msg: "[DEBUG] post render dom snapshot",
          data: {
            href: location.href,
            bodyChildCount: document.body.children.length,
            centerTag: center?.tagName ?? null,
            centerText: center?.textContent?.slice(0, 80) ?? null,
            modalCount: document.querySelectorAll('[role="dialog"]').length,
            ariaBusyCount: document.querySelectorAll('[aria-busy="true"]').length,
            pointerNoneCount: document.querySelectorAll('[style*="pointer-events: none"]').length,
          },
          ts: Date.now(),
        }),
      }).catch(() => {})
    }, 1500)
    // #endregion
  }
}
