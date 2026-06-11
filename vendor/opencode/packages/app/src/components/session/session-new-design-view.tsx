import type { JSX } from "solid-js"
import { NEW_SESSION_CONTENT_WIDTH } from "@/pages/session/new-session-layout"

export function NewSessionDesignView(props: { children: JSX.Element }) {
  return (
    <div
      data-component="session-new-design"
      class="relative size-full overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fb_48%,#eef3f8_100%)]"
    >
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.14),transparent_58%)]" />
        <div class="absolute right-[10%] top-14 size-56 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.10),transparent_68%)] blur-3xl" />
        <div class="absolute left-[8%] top-24 size-44 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.08),transparent_72%)] blur-3xl" />
      </div>
      <div class="absolute inset-x-0 top-[24%] flex justify-center px-6">
        <div class={NEW_SESSION_CONTENT_WIDTH}>
          <div class="mt-2">{props.children}</div>
        </div>
      </div>
    </div>
  )
}
