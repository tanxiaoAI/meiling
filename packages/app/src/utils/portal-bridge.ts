export type PortalBridgeState = {
  displayName?: string
  email?: string
  baseUrl?: string
  logoutUrl?: string
  workspaceDirectory?: string
  packKey?: string
  packName?: string
  packVersion?: string
}

const STORAGE_KEY = "opencode.portal-bridge"

function storage() {
  if (typeof window === "undefined") return
  return window.localStorage
}

export function readPortalBridgeParams(search: string): PortalBridgeState {
  const params = new URLSearchParams(search)
  return {
    displayName: params.get("portal_display_name") ?? undefined,
    email: params.get("portal_email") ?? undefined,
    baseUrl: params.get("portal_base_url") ?? undefined,
    logoutUrl: params.get("portal_logout_url") ?? undefined,
    workspaceDirectory: params.get("portal_workspace_directory") ?? undefined,
    packKey: params.get("portal_pack_key") ?? undefined,
    packName: params.get("portal_pack_name") ?? undefined,
    packVersion: params.get("portal_pack_version") ?? undefined,
  }
}

export function hasPortalBridgeParams(search: string) {
  const params = new URLSearchParams(search)
  return [
    "portal_display_name",
    "portal_email",
    "portal_base_url",
    "portal_logout_url",
    "portal_workspace_directory",
    "portal_pack_key",
    "portal_pack_name",
    "portal_pack_version",
  ].some((key) => params.has(key))
}

export function savePortalBridgeState(input: PortalBridgeState) {
  const target = storage()
  if (!target) return
  target.setItem(STORAGE_KEY, JSON.stringify(input))
}

export function loadPortalBridgeState(): PortalBridgeState | undefined {
  const target = storage()
  if (!target) return
  const raw = target.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    return JSON.parse(raw) as PortalBridgeState
  } catch {
    return
  }
}

export function clearPortalBridgeState() {
  storage()?.removeItem(STORAGE_KEY)
}
