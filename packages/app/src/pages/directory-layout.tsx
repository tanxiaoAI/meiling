import { DataProvider } from "@opencode-ai/ui/context"
import { showToast } from "@/utils/toast"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { pathKey } from "@/utils/path-key"
import { useLocation, useNavigate, useParams } from "@solidjs/router"
import { createEffect, createMemo, createResource, type ParentProps, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { LocalProvider } from "@/context/local"
import { SDKProvider } from "@/context/sdk"
import { useServerSync } from "@/context/server-sync"
import { useSync } from "@/context/sync"
import { decode64 } from "@/utils/base64"
import { loadPortalBridgeState } from "@/utils/portal-bridge"
import { Schema } from "effect"

function DirectoryDataProvider(props: ParentProps<{ directory: string }>) {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const sync = useSync()
  const serverSync = useServerSync()
  const slug = createMemo(() => base64Encode(props.directory))
  const portalWorkspaceDirectory = createMemo(() => loadPortalBridgeState()?.workspaceDirectory?.trim())

  createEffect(() => {
    const next = sync.data.path.directory
    if (!next || next === props.directory) return
    const portalDirectory = portalWorkspaceDirectory()
    if (portalDirectory && pathKey(props.directory) === pathKey(portalDirectory)) return
    const path = location.pathname.slice(slug().length + 1)
    navigate(`/${base64Encode(next)}${path}${location.search}${location.hash}`, { replace: true })
  })

  createEffect(() => {
    const globalDirectory = serverSync.data.path.directory
    if (!globalDirectory || globalDirectory === props.directory) return
    const portalDirectory = portalWorkspaceDirectory()
    if (portalDirectory && pathKey(props.directory) === pathKey(portalDirectory)) return
    const path = location.pathname.slice(slug().length + 1)
    navigate(`/${base64Encode(globalDirectory)}${path}${location.search}${location.hash}`, { replace: true })
  })

  createResource(
    () => params.id,
    (id) => sync.session.sync(id).catch(() => {}),
  )

  return (
    <DataProvider
      data={sync.data}
      directory={props.directory}
      onNavigateToSession={(sessionID: string) => navigate(`/${slug()}/session/${sessionID}`)}
      onSessionHref={(sessionID: string) => `/${slug()}/session/${sessionID}`}
    >
      <LocalProvider>{props.children}</LocalProvider>
    </DataProvider>
  )
}

export const ProjectDirString = Schema.String.pipe(Schema.brand("ProjectDirString"))
export type ProjectDirString = Schema.Schema.Type<typeof ProjectDirString>

export function decodeDirectory(dir: string): ProjectDirString | undefined {
  const decoded = decode64(dir)
  if (!decoded) return
  return ProjectDirString.make(decoded)
}

export default function Layout(props: ParentProps) {
  const params = useParams()
  const language = useLanguage()
  const navigate = useNavigate()
  const portalWorkspaceDirectory = createMemo(() => loadPortalBridgeState()?.workspaceDirectory?.trim())
  let invalid = ""

  const resolved = createMemo(() => {
    const portalDirectory = portalWorkspaceDirectory()
    if (portalDirectory) return portalDirectory
    if (!params.dir) return ""
    return decodeDirectory(params.dir) ?? ""
  })

  createEffect(() => {
    const portalDirectory = portalWorkspaceDirectory()
    if (!portalDirectory) return
    const expected = base64Encode(portalDirectory)
    if (params.dir === expected) return
    const sessionPath = params.id ? `/session/${params.id}` : "/session"
    navigate(`/${expected}${sessionPath}${location.search}${location.hash}`, { replace: true })
  })

  createEffect(() => {
    const dir = params.dir
    if (!dir) return
    if (resolved()) {
      invalid = ""
      return
    }
    if (invalid === dir) return
    invalid = dir
    showToast({
      variant: "error",
      title: language.t("common.requestFailed"),
      description: language.t("directory.error.invalidUrl"),
    })
    navigate("/", { replace: true })
  })

  return (
    <Show when={resolved()} keyed>
      {(resolved) => (
        <SDKProvider directory={resolved}>
          <DirectoryDataProvider directory={resolved}>{props.children}</DirectoryDataProvider>
        </SDKProvider>
      )}
    </Show>
  )
}
