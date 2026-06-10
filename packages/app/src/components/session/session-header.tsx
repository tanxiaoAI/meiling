import { AppIcon } from "@opencode-ai/ui/app-icon"
import { Button } from "@opencode-ai/ui/button"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Keybind } from "@opencode-ai/ui/keybind"
import { Spinner } from "@opencode-ai/ui/spinner"
import { showToast } from "@/utils/toast"
import { Tooltip, TooltipKeybind } from "@opencode-ai/ui/tooltip"
import { getFilename } from "@opencode-ai/core/util/path"
import { createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { Portal } from "solid-js/web"
import { useCommand } from "@/context/command"
import { useLanguage } from "@/context/language"
import { useLayout } from "@/context/layout"
import { usePlatform } from "@/context/platform"
import { useServer } from "@/context/server"
import { useSettings } from "@/context/settings"
import { useSync } from "@/context/sync"
import { useTerminal } from "@/context/terminal"
import { focusTerminalById } from "@/pages/session/helpers"
import { useSessionLayout } from "@/pages/session/session-layout"
import { messageAgentColor } from "@/utils/agent"
import { decode64 } from "@/utils/base64"
import { clearPortalBridgeState, loadPortalBridgeState } from "@/utils/portal-bridge"
import { Persist, persisted, removePersisted } from "@/utils/persist"
import { StatusPopover, StatusPopoverV2 } from "../status-popover"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"

const OPEN_APPS = [
  "vscode",
  "cursor",
  "zed",
  "textmate",
  "antigravity",
  "finder",
  "terminal",
  "iterm2",
  "ghostty",
  "warp",
  "xcode",
  "android-studio",
  "powershell",
  "sublime-text",
] as const

type OpenApp = (typeof OPEN_APPS)[number]
type OS = "macos" | "windows" | "linux" | "unknown"

const MAC_APPS = [
  {
    id: "vscode",
    label: "session.header.open.app.vscode",
    icon: "vscode",
    openWith: "Visual Studio Code",
  },
  { id: "cursor", label: "session.header.open.app.cursor", icon: "cursor", openWith: "Cursor" },
  { id: "zed", label: "session.header.open.app.zed", icon: "zed", openWith: "Zed" },
  { id: "textmate", label: "session.header.open.app.textmate", icon: "textmate", openWith: "TextMate" },
  {
    id: "antigravity",
    label: "session.header.open.app.antigravity",
    icon: "antigravity",
    openWith: "Antigravity",
  },
  { id: "terminal", label: "session.header.open.app.terminal", icon: "terminal", openWith: "Terminal" },
  { id: "iterm2", label: "session.header.open.app.iterm2", icon: "iterm2", openWith: "iTerm" },
  { id: "ghostty", label: "session.header.open.app.ghostty", icon: "ghostty", openWith: "Ghostty" },
  { id: "warp", label: "session.header.open.app.warp", icon: "warp", openWith: "Warp" },
  { id: "xcode", label: "session.header.open.app.xcode", icon: "xcode", openWith: "Xcode" },
  {
    id: "android-studio",
    label: "session.header.open.app.androidStudio",
    icon: "android-studio",
    openWith: "Android Studio",
  },
  {
    id: "sublime-text",
    label: "session.header.open.app.sublimeText",
    icon: "sublime-text",
    openWith: "Sublime Text",
  },
] as const

const WINDOWS_APPS = [
  { id: "vscode", label: "session.header.open.app.vscode", icon: "vscode", openWith: "code" },
  { id: "cursor", label: "session.header.open.app.cursor", icon: "cursor", openWith: "cursor" },
  { id: "zed", label: "session.header.open.app.zed", icon: "zed", openWith: "zed" },
  {
    id: "powershell",
    label: "session.header.open.app.powershell",
    icon: "powershell",
    openWith: "powershell",
  },
  {
    id: "sublime-text",
    label: "session.header.open.app.sublimeText",
    icon: "sublime-text",
    openWith: "Sublime Text",
  },
] as const

const LINUX_APPS = [
  { id: "vscode", label: "session.header.open.app.vscode", icon: "vscode", openWith: "code" },
  { id: "cursor", label: "session.header.open.app.cursor", icon: "cursor", openWith: "cursor" },
  { id: "zed", label: "session.header.open.app.zed", icon: "zed", openWith: "zed" },
  {
    id: "sublime-text",
    label: "session.header.open.app.sublimeText",
    icon: "sublime-text",
    openWith: "Sublime Text",
  },
] as const

const detectOS = (platform: ReturnType<typeof usePlatform>): OS => {
  if (platform.platform === "desktop" && platform.os) return platform.os
  if (typeof navigator !== "object") return "unknown"
  const value = navigator.platform || navigator.userAgent
  if (/Mac/i.test(value)) return "macos"
  if (/Win/i.test(value)) return "windows"
  if (/Linux/i.test(value)) return "linux"
  return "unknown"
}

const showRequestError = (language: ReturnType<typeof useLanguage>, err: unknown) => {
  showToast({
    variant: "error",
    title: language.t("common.requestFailed"),
    description: err instanceof Error ? err.message : String(err),
  })
}

export function SessionHeader() {
  const layout = useLayout()
  const command = useCommand()
  const server = useServer()
  const platform = usePlatform()
  const language = useLanguage()
  const settings = useSettings()
  const sync = useSync()
  const terminal = useTerminal()
  const { params, view } = useSessionLayout()

  const projectDirectory = createMemo(() => decode64(params.dir) ?? "")
  const project = createMemo(() => {
    const directory = projectDirectory()
    if (!directory) return
    return layout.projects.list().find((p) => p.worktree === directory || p.sandboxes?.includes(directory))
  })
  const name = createMemo(() => {
    const current = project()
    if (current) return current.name || getFilename(current.worktree)
    return getFilename(projectDirectory())
  })
  const hotkey = createMemo(() => command.keybind("file.open"))
  const os = createMemo(() => detectOS(platform))
  const isDesktopV2 = createMemo(() => platform.platform === "desktop" && settings.general.newLayoutDesigns())
  const search = createMemo(() => (isDesktopV2() ? settings.general.showSearch() : true))
  const tree = createMemo(() => (isDesktopV2() ? settings.general.showFileTree() : true))
  const term = createMemo(() => (isDesktopV2() ? settings.general.showTerminal() : true))
  const status = createMemo(() => (isDesktopV2() ? settings.general.showStatus() : true))

  const [exists, setExists] = createStore<Partial<Record<OpenApp, boolean>>>({
    finder: true,
  })

  const apps = createMemo(() => {
    if (os() === "macos") return MAC_APPS
    if (os() === "windows") return WINDOWS_APPS
    return LINUX_APPS
  })

  const fileManager = createMemo(() => {
    if (os() === "macos") return { label: "session.header.open.finder", icon: "finder" as const }
    if (os() === "windows") return { label: "session.header.open.fileExplorer", icon: "file-explorer" as const }
    return { label: "session.header.open.fileManager", icon: "finder" as const }
  })

  createEffect(() => {
    if (platform.platform !== "desktop") return
    if (!platform.checkAppExists) return

    const list = apps()

    setExists(Object.fromEntries(list.map((app) => [app.id, undefined])) as Partial<Record<OpenApp, boolean>>)

    void Promise.all(
      list.map((app) =>
        Promise.resolve(platform.checkAppExists?.(app.openWith))
          .then((value) => Boolean(value))
          .catch(() => false)
          .then((ok) => [app.id, ok] as const),
      ),
    ).then((entries) => {
      setExists(Object.fromEntries(entries) as Partial<Record<OpenApp, boolean>>)
    })
  })

  const options = createMemo(() => {
    return [
      { id: "finder", label: language.t(fileManager().label), icon: fileManager().icon },
      ...apps()
        .filter((app) => exists[app.id])
        .map((app) => ({ ...app, label: language.t(app.label) })),
    ] as const
  })

  const toggleTerminal = () => {
    const next = !view().terminal.opened()
    view().terminal.toggle()
    if (!next) return

    const id = terminal.active()
    if (!id) return
    focusTerminalById(id)
  }

  const [prefs, setPrefs] = persisted(Persist.global("open.app"), createStore({ app: "finder" as OpenApp }))
  const [menu, setMenu] = createStore({ open: false })
  const [openRequest, setOpenRequest] = createStore({
    app: undefined as OpenApp | undefined,
  })

  const canOpen = createMemo(() => platform.platform === "desktop" && !!platform.openPath && server.isLocal())
  const current = createMemo(
    () =>
      options().find((o) => o.id === prefs.app) ??
      options()[0] ??
      ({ id: "finder", label: fileManager().label, icon: fileManager().icon } as const),
  )
  const opening = createMemo(() => openRequest.app !== undefined)
  const tint = createMemo(() =>
    messageAgentColor(params.id ? sync.data.message[params.id] : undefined, sync.data.agent),
  )
  const v2ActionsState = createMemo<SessionHeaderV2ActionsState>(() => ({
    statusVisible: status(),
    statusLabel: language.t("status.popover.trigger"),
  }))

  const selectApp = (app: OpenApp) => {
    if (!options().some((item) => item.id === app)) return
    setPrefs("app", app)
  }

  const openDir = (app: OpenApp) => {
    if (opening() || !canOpen() || !platform.openPath) return
    const directory = projectDirectory()
    if (!directory) return

    const item = options().find((o) => o.id === app)
    const openWith = item && "openWith" in item ? item.openWith : undefined
    setOpenRequest("app", app)
    platform
      .openPath(directory, openWith)
      .catch((err: unknown) => showRequestError(language, err))
      .finally(() => {
        setOpenRequest("app", undefined)
      })
  }

  const copyPath = () => {
    const directory = projectDirectory()
    if (!directory) return
    navigator.clipboard
      .writeText(directory)
      .then(() => {
        showToast({
          variant: "success",
          icon: "circle-check",
          title: language.t("session.share.copy.copied"),
          description: directory,
        })
      })
      .catch((err: unknown) => showRequestError(language, err))
  }

  const [centerMount, setCenterMount] = createSignal<HTMLElement | null>(null)
  const [rightMount, setRightMount] = createSignal<HTMLElement | null>(null)
  onMount(() => {
    setCenterMount(document.getElementById("opencode-titlebar-center"))
    setRightMount(document.getElementById("opencode-titlebar-right"))
  })

  return (
    <>
      <Show when={search() && centerMount()}>
        {(mount) => (
          <Portal mount={mount()}>
            <Button
              type="button"
              variant="ghost"
              size="small"
              class="hidden md:flex h-10 w-[280px] max-w-full min-w-0 items-center gap-3 justify-between rounded-[14px] border border-[rgba(148,163,184,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.90)_100%)] px-3 shadow-[0_10px_26px_rgba(15,23,42,0.06)] cursor-default backdrop-blur"
              onClick={() => command.trigger("file.open")}
              aria-label={language.t("session.header.searchFiles")}
            >
              <div class="flex min-w-0 flex-1 items-center gap-2 overflow-visible">
                <div class="flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgba(37,99,235,0.10)] text-[var(--v2-text-text-accent)]">
                  <Icon name="search" size="small" />
                </div>
                <span class="flex-1 min-w-0 text-[13px] font-medium text-[var(--v2-text-text-muted)] truncate text-left">
                  {language.t("session.header.search.placeholder", {
                    project: name(),
                  })}
                </span>
              </div>

              <Show when={hotkey()}>
                {(keybind) => (
                  <Keybind class="shrink-0 rounded-full !border-[rgba(148,163,184,0.16)] !bg-white/70 !shadow-none px-2 text-text-weaker">
                    {keybind()}
                  </Keybind>
                )}
              </Show>
            </Button>
          </Portal>
        )}
      </Show>
      <Show when={rightMount()}>
        {(mount) => (
          <Portal mount={mount()}>
            <Show
              when={isDesktopV2}
              fallback={
                <div class="flex items-center gap-2">
                  <Show when={projectDirectory()}>
                    <div class="hidden xl:flex items-center">
                      <Show
                        when={canOpen()}
                        fallback={
                          <div class="flex h-[24px] box-border items-center rounded-md border border-border-weak-base bg-surface-panel overflow-hidden">
                            <Button
                              variant="ghost"
                              class="rounded-none h-full py-0 pr-3 pl-0.5 gap-1.5 border-none shadow-none"
                              onClick={copyPath}
                              aria-label={language.t("session.header.open.copyPath")}
                            >
                              <Icon name="copy" size="small" class="text-icon-base" />
                              <span class="text-12-regular text-text-strong">
                                {language.t("session.header.open.copyPath")}
                              </span>
                            </Button>
                          </div>
                        }
                      >
                        <div class="flex items-center">
                          <div class="flex h-[24px] box-border items-center rounded-md border border-border-weak-base bg-surface-panel overflow-hidden">
                            <Button
                              variant="ghost"
                              class="rounded-none h-full px-0.5 border-none shadow-none disabled:!cursor-default"
                              classList={{
                                "bg-surface-raised-base-active": opening(),
                              }}
                              onClick={() => openDir(current().id)}
                              disabled={opening()}
                              aria-label={language.t("session.header.open.ariaLabel", { app: current().label })}
                            >
                              <div class="flex size-5 shrink-0 items-center justify-center [&_[data-component=app-icon]]:size-5">
                                <Show when={opening()} fallback={<AppIcon id={current().icon} />}>
                                  <Spinner class="size-3.5" style={{ color: tint() ?? "var(--icon-base)" }} />
                                </Show>
                              </div>
                            </Button>
                            <DropdownMenu
                              gutter={4}
                              placement="bottom-end"
                              open={menu.open}
                              onOpenChange={(open) => setMenu("open", open)}
                            >
                              <DropdownMenu.Trigger
                                as={IconButton}
                                icon="chevron-down"
                                variant="ghost"
                                disabled={opening()}
                                class="rounded-none h-full w-[20px] p-0 border-none shadow-none data-[expanded]:bg-surface-raised-base-active disabled:!cursor-default"
                                classList={{
                                  "bg-surface-raised-base-active": opening(),
                                }}
                                aria-label={language.t("session.header.open.menu")}
                              />
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content class="[&_[data-slot=dropdown-menu-item]]:pl-1 [&_[data-slot=dropdown-menu-radio-item]]:pl-1 [&_[data-slot=dropdown-menu-radio-item]+[data-slot=dropdown-menu-radio-item]]:mt-1">
                                  <DropdownMenu.Group>
                                    <DropdownMenu.GroupLabel class="!px-1 !py-1">
                                      {language.t("session.header.openIn")}
                                    </DropdownMenu.GroupLabel>
                                    <DropdownMenu.RadioGroup
                                      class="mt-1"
                                      value={current().id}
                                      onChange={(value) => {
                                        if (!OPEN_APPS.includes(value as OpenApp)) return
                                        selectApp(value as OpenApp)
                                      }}
                                    >
                                      <For each={options()}>
                                        {(o) => (
                                          <DropdownMenu.RadioItem
                                            value={o.id}
                                            disabled={opening()}
                                            onSelect={() => {
                                              setMenu("open", false)
                                              openDir(o.id)
                                            }}
                                          >
                                            <div class="flex size-5 shrink-0 items-center justify-center [&_[data-component=app-icon]]:size-5">
                                              <AppIcon id={o.icon} />
                                            </div>
                                            <DropdownMenu.ItemLabel>{o.label}</DropdownMenu.ItemLabel>
                                            <DropdownMenu.ItemIndicator>
                                              <Icon name="check-small" size="small" class="text-icon-weak" />
                                            </DropdownMenu.ItemIndicator>
                                          </DropdownMenu.RadioItem>
                                        )}
                                      </For>
                                    </DropdownMenu.RadioGroup>
                                  </DropdownMenu.Group>
                                  <DropdownMenu.Separator />
                                  <DropdownMenu.Item
                                    onSelect={() => {
                                      setMenu("open", false)
                                      copyPath()
                                    }}
                                  >
                                    <div class="flex size-5 shrink-0 items-center justify-center">
                                      <Icon name="copy" size="small" class="text-icon-weak" />
                                    </div>
                                    <DropdownMenu.ItemLabel>
                                      {language.t("session.header.open.copyPath")}
                                    </DropdownMenu.ItemLabel>
                                  </DropdownMenu.Item>
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Show>
                    </div>
                  </Show>
                  <div class="flex items-center gap-1">
                    <Show when={status()}>
                      <Tooltip placement="bottom" value={language.t("status.popover.trigger")}>
                        <StatusPopover />
                      </Tooltip>
                    </Show>
                    <SessionAccountMenu />
                    <Show when={term()}>
                      <TooltipKeybind
                        title={language.t("command.terminal.toggle")}
                        keybind={command.keybind("terminal.toggle")}
                      >
                        <Button
                          variant="ghost"
                          class="group/terminal-toggle titlebar-icon w-8 h-6 p-0 box-border shrink-0"
                          onClick={toggleTerminal}
                          aria-label={language.t("command.terminal.toggle")}
                          aria-expanded={view().terminal.opened()}
                          aria-controls="terminal-panel"
                        >
                          <Icon size="small" name={view().terminal.opened() ? "terminal-active" : "terminal"} />
                        </Button>
                      </TooltipKeybind>
                    </Show>

                    <div class="hidden md:flex items-center gap-1 shrink-0">
                      <TooltipKeybind
                        title={language.t("command.review.toggle")}
                        keybind={command.keybind("review.toggle")}
                      >
                        <Button
                          variant="ghost"
                          class="group/review-toggle titlebar-icon w-8 h-6 p-0 box-border"
                          onClick={() => view().reviewPanel.toggle()}
                          aria-label={language.t("command.review.toggle")}
                          aria-expanded={view().reviewPanel.opened()}
                          aria-controls="review-panel"
                        >
                          <Icon size="small" name={view().reviewPanel.opened() ? "review-active" : "review"} />
                        </Button>
                      </TooltipKeybind>

                      <Show when={tree()}>
                        <TooltipKeybind
                          title={language.t("command.fileTree.toggle")}
                          keybind={command.keybind("fileTree.toggle")}
                        >
                          <Button
                            variant="ghost"
                            class="titlebar-icon w-8 h-6 p-0 box-border"
                            onClick={() => layout.fileTree.toggle()}
                            aria-label={language.t("command.fileTree.toggle")}
                            aria-expanded={layout.fileTree.opened()}
                            aria-controls="file-tree-panel"
                          >
                            <div class="relative flex items-center justify-center size-4">
                              <Icon
                                size="small"
                                name={layout.fileTree.opened() ? "file-tree-active" : "file-tree"}
                                classList={{
                                  "text-icon-strong": layout.fileTree.opened(),
                                  "text-icon-weak": !layout.fileTree.opened(),
                                }}
                              />
                            </div>
                          </Button>
                        </TooltipKeybind>
                      </Show>
                    </div>
                  </div>
                </div>
              }
            >
              <SessionHeaderV2Actions state={v2ActionsState()} />
            </Show>
          </Portal>
        )}
      </Show>
    </>
  )
}

type SessionHeaderV2ActionsState = {
  statusVisible: boolean
  statusLabel: string
}

function SessionHeaderV2Actions(props: { state: SessionHeaderV2ActionsState }) {
  return (
    <div class="flex min-w-[116px] shrink-0 items-center justify-end gap-2 pr-1">
      <Show when={props.state.statusVisible}>
        <Tooltip placement="bottom" value={props.state.statusLabel}>
          <StatusPopoverV2 />
        </Tooltip>
      </Show>
      <SessionAccountMenu v2 />
    </div>
  )
}

function SessionAccountMenu(props: { v2?: boolean }) {
  const server = useServer()
  const platform = usePlatform()
  const command = useCommand()
  const portalBridge = createMemo(() => loadPortalBridgeState())

  const username = createMemo(() => server.current?.http.username?.trim() || portalBridge()?.email?.trim() || "当前账号")
  const nickname = createMemo(() => server.current?.displayName?.trim() || portalBridge()?.displayName?.trim() || username())
  const subtitle = createMemo(() => {
    const baseUrl = portalBridge()?.baseUrl?.trim()
    if (baseUrl) return baseUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    return server.current?.http.url.replace(/^https?:\/\//, "").replace(/\/+$/, "") || ""
  })
  const avatarText = createMemo(() => nickname().trim().slice(0, 1).toUpperCase() || "A")

  const logout = () => {
    removePersisted(Persist.global("server", ["server.v3"]), platform)
    void platform.setDefaultServer?.(null)
    clearPortalBridgeState()
    window.location.replace(resolvePortalLogoutUrl())
  }

  const triggerClass = () =>
    props.v2
      ? "flex h-8 min-w-[44px] shrink-0 items-center justify-center rounded-full border border-[rgba(148,163,184,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.90)_100%)] px-1 text-[13px] text-v2-text-text-base shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition hover:bg-white data-[expanded]:bg-white"
      : "flex h-8 shrink-0 items-center gap-2 rounded-lg border border-border-weak-base bg-surface-panel px-2.5 text-12-regular text-text-strong transition hover:bg-surface-raised-base-hover data-[expanded]:bg-surface-raised-base-active"

  return (
    <DropdownMenu gutter={6} placement="bottom-end" modal={false}>
      <DropdownMenu.Trigger
        as={Button}
        variant="ghost"
        class={triggerClass()}
        aria-label="账号菜单"
      >
        <span class="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700">
          {avatarText()}
        </span>
        <Show when={!props.v2}>
          <span class="hidden max-w-28 truncate text-left md:block">{nickname()}</span>
        </Show>
        <Show when={!props.v2}>
          <Icon
            name="chevron-down"
            size="small"
            classList={{
              "text-icon-weak": true,
            }}
          />
        </Show>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="min-w-[240px]">
          <div class="px-3 py-2.5">
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-emerald-500" />
              <span class="text-12-medium text-[color:var(--text-success-base,var(--text-strong))]">已登录</span>
            </div>
            <div class="mt-2 text-14-medium text-text-strong">{nickname()}</div>
            <div class="mt-1 text-12-regular text-text-weak">{username()}</div>
            <Show when={subtitle()}>
              {(value) => <div class="mt-1 text-12-regular text-text-weaker break-all">{value()}</div>}
            </Show>
          </div>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onSelect={logout}>
            <div class="flex size-5 shrink-0 items-center justify-center">
              <Icon name="logout" size="small" class="text-icon-weak" />
            </div>
            <DropdownMenu.ItemLabel>退出登录</DropdownMenu.ItemLabel>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu>
  )
}

function resolvePortalLogoutUrl() {
  const bridge = loadPortalBridgeState()
  if (bridge?.logoutUrl) return bridge.logoutUrl
  const configured = import.meta.env.VITE_PORTAL_BASE_URL?.trim()
  if (configured) {
    return new URL("/api/auth/logout", configured).toString()
  }

  const current = new URL(window.location.href)
  if (current.port === "4444") {
    current.port = "3000"
  }
  current.pathname = "/api/auth/logout"
  current.search = ""
  current.hash = ""
  return current.toString()
}
