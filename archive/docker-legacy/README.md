# Docker Legacy Archive

这个目录保存仓库里已经归档的旧 Docker 封装链路，避免它继续干扰当前的源码模式排查与部署判断。

包含内容：

- `opencode-service/`
- `deployment/zeabur/`
- `deploy-local.sh`
- `deploy-prod-local.sh`
- `LOCAL-DEPLOYMENT.md`
- `本地部署指南.md`
- `docs/deployment.md`

使用说明：

- 当前主线以 `vendor/opencode/` 源码模式为准。
- 这里只用于追溯旧实现，不作为当前 Zeabur 服务配置依据。
- 如果后续确认需要恢复 Docker 封装链路，再从这里挑选性迁回，不要直接重新引入整套旧配置。
