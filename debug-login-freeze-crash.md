# [OPEN] login-freeze-crash

## 问题描述

- 现象：登录后偶尔能进入页面，但页面内元素无法点击，随后应用崩溃。
- 影响：阻断 Portal -> OpenCode 登录链路，无法稳定进入可交互工作台。
- 当前阶段：仅做运行时采证，暂不修改业务逻辑。

## 已知现象

- 外部浏览器与 Trae 内置浏览器表现不一致。
- 之前出现过登录后错误页、旧页面状态残留、跳转端口不一致。
- 最新用户反馈为：页面能打开，但无法交互，过一会崩溃。

## 初始假设

- H1：Portal 进入 OpenCode 后，前端初始化存在竞态，导致 provider/context 层短暂可见但未就绪。
- H2：旧的本地持久化状态与当前 portal 注入参数冲突，页面渲染后进入异常状态。
- H3：某个请求在初始化期持续失败或重试，导致 UI 阻塞，随后触发错误边界。
- H4：浏览器端事件层被遮罩、不可见层或错误状态组件占住，导致“看得见但点不了”。
- H5：服务端或前端 HMR/热更新在登录后触发重载，破坏当前页面状态并最终崩溃。

## 采证计划

- 在 Portal 登录跳转、OpenCode 入口、ServerSDK 初始化、页面错误边界这 4 个点打日志。
- 先复现一次“能进入页面但不能点击，然后崩溃”的完整链路。
- 根据日志确认是初始化竞态、状态污染、请求失败还是遮罩层问题。

## 当前结论

- H1：部分成立，但不是首因。前端存在二次初始化/重复挂载迹象，`C:server sdk context init` 与 `C:event stream start` 在错误后再次出现。
- H2：基本排除。`B:entry bootstrap` 显示 bridge 参数正常落地，且 `storedBridge` 为 `null`，本次复现不是旧状态污染主导。
- H3：成立。浏览器网络抓到 `GET /session?directory=%2Fworkspace%2Fusers%2Fdemo-at-aimedia.local&roots=true&limit=55 -> 500`，前端控制台报 `Failed to finish bootstrap instance`。
- H4：排除为首因。`B:post render dom snapshot` 虽显示 `pointerNoneCount: 1`，但无 modal、无 busy，且页面先可渲染；真正崩溃点是后续错误边界。
- H5：不成立。没有看到 HMR 导致的页面重载链路，主问题与工作区初始化错误一致。

## 关键证据

- Portal 登录跳转正常：
  - `A: login redirect built` 指向 `http://127.0.0.1:4445/...`
- OpenCode 入口与 SDK 初始化正常启动：
  - `B: entry bootstrap`
  - `C: server sdk context init`
  - `C: event stream start`
- 约 4 秒后前端进入错误边界：
  - `D: error boundary fallback`
  - 错误为 `RangeError: Maximum call stack size exceeded`
  - 控制台同时出现 `Failed to finish bootstrap instance Error: Unexpected server error. Check server logs for details.`
- 网络侧确定后端 500 发生在：
  - `GET /session?directory=%2Fworkspace%2Fusers%2Fdemo-at-aimedia.local&roots=true&limit=55`
  - 响应 `ref=err_60bea9ad`
- 服务端 `dev.log` 已定位真实异常：
  - `err_60bea9ad -> EFAULT: bad address in system call argument, rm .../02-业务方法论`
  - 随后连续出现 `EINVAL` / `ENOENT` / `EEXIST`
  - 堆栈统一落在 `replaceWithCopy()` -> `ensureMeilingUserWorkspace()`
- `E` 类插桩显示同一用户目录在一次进入过程中被重复初始化：
  - 同一时间窗口内多次 `resolve portal workspace request`
  - 同一 source/target 多次重复 `replaceWithCopy start`

## 根因判断

- 根因已基本确认：`workspace-routing.ts` 在多个初始化请求中反复调用 `ensureMeilingUserWorkspace()`，而 `ensureMeilingUserWorkspace()` 当前每次都会对方法论包目录执行 `rm + cp`。
- 这些并发初始化互相打架，导致同一路径上交替出现 `EFAULT` / `EINVAL` / `ENOENT` / `EEXIST`。
- `/session` 请求先失败为 500，前端 bootstrap 报错；随后错误对象在 UI 层继续传播，触发 `ErrorBoundary`，表现为“页面能打开但点不了，过一会崩溃”。

## 下一步

- 先做最小修复：
  - 对 `ensureMeilingUserWorkspace()` 增加按用户目录去重/串行保护，避免同一用户工作区被并发初始化。
- 再做 post-fix 复现：
  - 验证 `/session` 不再 500
  - 验证页面不再出现 `Failed to finish bootstrap instance`
  - 验证不再触发 `RangeError`

## Post-Fix 验证

- 已应用最小修复：
  - `ensureMeilingUserWorkspace()` 新增同一工作区初始化 promise 去重。
  - 若 manifest 与 pack/context 均匹配，则直接复用已准备好的工作区，不再重复 `rm + cp`。
- 复测结果：
  - `GET /session?directory=%2Fworkspace%2Fusers%2Fdemo-at-aimedia.local&roots=true&limit=55 -> 200`
  - 当前复测页面 5 秒后仍保持可见，无 `Failed to finish bootstrap instance`
  - 当前复测页面控制台无 `500`、无错误边界消息
  - 点击 `新建会话` 至少可触发前端点击，不再出现“整页完全不可点”的立即复现
- 服务端验证：
  - 清空后的 `dev.log` 中未再出现 `err_60bea9ad` 对应这类 `replaceWithCopy()/ensureMeilingUserWorkspace()` 初始化异常
- 残余观察：
  - 调试日志里仍能看到旧页面上下文遗留的 `D:error boundary fallback` 记录，因此需要用户在自己的实际页面再确认一次。
  - 调试插桩与 Debug Server 暂时保留，待用户确认彻底恢复后再清理。
