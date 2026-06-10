import type { JSX } from "solid-js"
import { NEW_SESSION_CONTENT_WIDTH } from "@/pages/session/new-session-layout"

export function NewSessionDesignView(props: { children: JSX.Element }) {
  return (
    <div
      data-component="session-new-design"
      class="relative size-full overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.06),transparent_22%),var(--v2-background-bg-deep)]"
    >
      <div class="absolute inset-x-0 top-[29%] flex justify-center px-6">
        <div class={NEW_SESSION_CONTENT_WIDTH}>
          <div class="mt-2">{props.children}</div>
        </div>
      </div>
    </div>
  )
}
