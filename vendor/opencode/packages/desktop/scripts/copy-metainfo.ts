import { resolveChannel } from "./utils"

const arg = process.argv[2]
const channel = arg === "dev" || arg === "beta" || arg === "prod" ? arg : resolveChannel()

const appId = channel === "prod" ? "ai.meiling.desktop" : `ai.meiling.desktop.${channel}`
const productName = channel === "prod" ? "媒灵" : `媒灵 ${channel.charAt(0).toUpperCase() + channel.slice(1)}`
const summary = `AI coding agent${channel !== "prod" ? ` (${channel})` : ""}`

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>${appId}</id>

  <metadata_license>CC0-1.0</metadata_license>
  <project_license>MIT</project_license>

  <name>${productName}</name>
  <summary>${summary}</summary>

  <developer id="ly.anoma">
    <name>媒灵</name>
  </developer>

  <description>
    <p>
      媒灵是一款可帮助你使用任意 AI 模型编写和运行代码的智能体应用。
    </p>
  </description>

  <launchable type="desktop-id">${appId}.desktop</launchable>

  <content_rating type="oars-1.1" />

</component>
`

await Bun.write(`resources/${appId}.metainfo.xml`, xml)
console.log(`Generated metainfo for ${channel} at resources/${appId}.metainfo.xml`)
