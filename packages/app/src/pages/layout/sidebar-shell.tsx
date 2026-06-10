import { createEffect, createMemo, For, Show, type Accessor, type JSX } from "solid-js"
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  closestCenter,
  type DragEvent,
} from "@thisbeyond/solid-dnd"
import { ConstrainDragXAxis } from "@/utils/solid-dnd"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tooltip, TooltipKeybind } from "@opencode-ai/ui/tooltip"
import { type LocalProject } from "@/context/layout"

export const SidebarContent = (props: {
  mobile?: boolean
  opened: Accessor<boolean>
  aimMove: (event: MouseEvent) => void
  projects: Accessor<LocalProject[]>
  renderProject: (project: LocalProject) => JSX.Element
  handleDragStart: (event: unknown) => void
  handleDragEnd: () => void
  handleDragOver: (event: DragEvent) => void
  openProjectLabel: JSX.Element
  openProjectKeybind: Accessor<string | undefined>
  onOpenProject: () => void
  renderProjectOverlay: () => JSX.Element
  workbenchLabel?: Accessor<string>
  onOpenWorkbench?: () => void
  settingsLabel: Accessor<string>
  settingsKeybind: Accessor<string | undefined>
  onOpenSettings: () => void
  helpLabel: Accessor<string>
  onOpenHelp: () => void
  renderPanel: () => JSX.Element
}): JSX.Element => {
  const expanded = createMemo(() => !!props.mobile || props.opened())
  const placement = () => (props.mobile ? "bottom" : "right")
  let panel: HTMLDivElement | undefined

  createEffect(() => {
    const el = panel
    if (!el) return
    if (expanded()) {
      el.removeAttribute("inert")
      return
    }
    el.setAttribute("inert", "")
  })

  return (
    <div class="flex h-full w-full min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.05),transparent_24%),var(--v2-background-bg-deep)]">
      <div
        data-component="sidebar-rail"
        class="w-16 shrink-0 flex flex-col items-center overflow-hidden border-r border-[color:var(--v2-border-border-muted)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--v2-background-bg-layer-01)_92%,white)_0%,var(--v2-background-bg-deep)_100%)]"
        onMouseMove={props.aimMove}
      >
        <div class="shrink-0 w-full px-2 pt-3 pb-3 flex flex-col items-center gap-3">
          <div class="flex w-full flex-col items-center gap-2 rounded-[22px] border border-[color:var(--v2-border-border-base)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.94)_100%)] px-2 py-3 shadow-[var(--v2-elevation-raised)] backdrop-blur">
            <div class="flex size-10 items-center justify-center rounded-[16px] border border-[rgba(37,99,235,0.10)] bg-[rgba(239,246,255,0.95)] text-[13px] font-semibold text-[#2563eb] shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
              AI
            </div>
            <div class="rounded-full bg-[rgba(148,163,184,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--v2-text-text-muted)]">
              Hub
            </div>
          </div>
          <div class="h-px w-8 bg-[color:var(--v2-border-border-muted)]" />
        </div>
        <div class="flex-1 min-h-0 w-full">
          <DragDropProvider
            onDragStart={props.handleDragStart}
            onDragEnd={props.handleDragEnd}
            onDragOver={props.handleDragOver}
            collisionDetector={closestCenter}
          >
            <DragDropSensors />
            <ConstrainDragXAxis />
            <div class="h-full w-full flex flex-col items-center gap-3 px-3 pb-3 overflow-y-auto no-scrollbar">
              <SortableProvider ids={props.projects().map((p) => p.worktree)}>
                <For each={props.projects()}>{(project) => props.renderProject(project)}</For>
              </SortableProvider>
              <Tooltip
                placement={placement()}
                value={
                  <div class="flex items-center gap-2">
                    <span>{props.openProjectLabel}</span>
                    <Show when={!props.mobile && !!props.openProjectKeybind()}>
                      <span class="text-icon-base text-12-medium">{props.openProjectKeybind()}</span>
                    </Show>
                  </div>
                }
              >
                <IconButton
                  icon="plus"
                  variant="ghost"
                  size="large"
                  class="size-11 rounded-[18px] border border-[rgba(37,99,235,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.96)_100%)] text-[#2563eb] shadow-[0_12px_24px_rgba(15,23,42,0.06)] hover:bg-[rgba(239,246,255,1)]"
                  onClick={props.onOpenProject}
                  aria-label={typeof props.openProjectLabel === "string" ? props.openProjectLabel : undefined}
                />
              </Tooltip>
            </div>
            <DragOverlay>{props.renderProjectOverlay()}</DragOverlay>
          </DragDropProvider>
        </div>
        <div class="shrink-0 w-full px-2 pt-3 pb-4">
          <div class="flex flex-col items-center gap-2 rounded-[20px] border border-[color:var(--v2-border-border-base)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.92)_100%)] py-2 shadow-[var(--v2-elevation-raised)]">
          {/*
            工作台按钮先注释保留。
            当前这条链路会把用户带去独立 workbench 页面，在客户交付场景下容易出现无 UI 或未就绪报错。
          <Tooltip placement={placement()} value={props.workbenchLabel?.()}>
            <IconButton
              icon="grid-plus"
              variant="ghost"
              size="large"
              onClick={props.onOpenWorkbench}
              aria-label={props.workbenchLabel?.()}
            />
          </Tooltip>
          */}
          <TooltipKeybind placement={placement()} title={props.settingsLabel()} keybind={props.settingsKeybind() ?? ""}>
            <IconButton
              icon="settings-gear"
              variant="ghost"
              size="large"
              onClick={props.onOpenSettings}
              aria-label={props.settingsLabel()}
            />
          </TooltipKeybind>
          <Tooltip placement={placement()} value={props.helpLabel()}>
            <IconButton
              icon="help"
              variant="ghost"
              size="large"
              onClick={props.onOpenHelp}
              aria-label={props.helpLabel()}
            />
          </Tooltip>
          </div>
        </div>
      </div>

      <div
        ref={(el) => {
          panel = el
        }}
        classList={{
          "flex-1 flex h-full min-h-0 min-w-0 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.40)_0%,transparent_100%)]": true,
          "pointer-events-none": !expanded(),
        }}
        aria-hidden={!expanded()}
      >
        {props.renderPanel()}
      </div>
    </div>
  )
}
