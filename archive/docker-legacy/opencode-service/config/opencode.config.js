/**
 * OpenCode 服务配置
 * 用于控制客户可见目录和访问权限
 */

module.exports = {
  // 工作空间配置
  workspace: {
    // 客户可见的根目录
    root: process.env.WORKSPACE_DIR || '/workspace',

    // 隐藏的目录（客户不可见）
    hiddenPaths: [
      '/opt/core-assets',
      '/workspace-internal',
      '/app',
      '/etc',
      '/usr',
      '/var',
      '/tmp'
    ],

    // 客户可访问的子目录
    allowedPaths: [
      '/workspace/inputs',
      '/workspace/benchmark-accounts',
      '/workspace/benchmark-contents',
      '/workspace/outputs',
      '/workspace/results'
    ],

    // 只读目录（客户可查看但不可修改）
    readOnlyPaths: [
      '/workspace/benchmark-accounts',
      '/workspace/benchmark-contents',
      '/workspace/outputs',
      '/workspace/results'
    ]
  },

  // 核心资产配置
  coreAssets: {
    path: process.env.CORE_ASSETS_DIR || '/opt/core-assets',
    readOnly: true,
    hidden: true
  },

  // 内部目录配置
  internal: {
    path: process.env.INTERNAL_DIR || '/workspace-internal',
    hidden: true
  },

  // 租户配置
  tenant: {
    id: process.env.TENANT_ID,
    name: process.env.TENANT_NAME || 'Customer',
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL
  },

  // AI 模型配置
  model: {
    provider: process.env.MODEL_PROVIDER || 'anthropic',
    name: process.env.MODEL_NAME || 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY
  },

  // 服务配置
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    username: process.env.OPENCODE_SERVER_USERNAME || 'opencode',
    password: process.env.OPENCODE_SERVER_PASSWORD
  },

  // 安全配置
  security: {
    // 禁止客户访问的文件扩展名
    forbiddenExtensions: ['.env', '.key', '.pem', '.p12'],

    // 禁止客户访问的文件名模式
    forbiddenPatterns: [
      /^\.git/,
      /^\.env/,
      /secret/i,
      /private/i,
      /credential/i
    ]
  }
};
