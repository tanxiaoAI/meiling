/**
 * OpenCode 文件系统访问控制中间件
 * 确保客户只能访问允许的目录，隐藏核心资产
 */

const path = require('path');
const config = require('./opencode.config');

class WorkspaceAccessControl {
  constructor() {
    this.workspaceRoot = config.workspace.root;
    this.hiddenPaths = config.workspace.hiddenPaths;
    this.allowedPaths = config.workspace.allowedPaths;
    this.readOnlyPaths = config.workspace.readOnlyPaths;
    this.forbiddenExtensions = config.security.forbiddenExtensions;
    this.forbiddenPatterns = config.security.forbiddenPatterns;
  }

  /**
   * 检查路径是否被隐藏（客户不可见）
   */
  isHidden(filePath) {
    const normalizedPath = path.normalize(filePath);

    // 检查是否在隐藏路径列表中
    for (const hiddenPath of this.hiddenPaths) {
      if (normalizedPath.startsWith(hiddenPath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查是否为 workspace 根目录下的直接文件（如 README.md）
   */
  isWorkspaceRootFile(filePath) {
    const normalizedPath = path.normalize(filePath);
    const parentDir = path.dirname(normalizedPath);
    return parentDir === this.workspaceRoot;
  }

  /**
   * 检查路径是否允许访问
   */
  isAllowed(filePath) {
    const normalizedPath = path.normalize(filePath);

    // 首先检查是否被隐藏
    if (this.isHidden(normalizedPath)) {
      return false;
    }

    // 检查是否在允许的路径中
    for (const allowedPath of this.allowedPaths) {
      if (normalizedPath.startsWith(allowedPath)) {
        return true;
      }
    }

    // 允许访问 workspace 根目录的直接文件（如 README.md）
    if (normalizedPath.startsWith(this.workspaceRoot) &&
        !normalizedPath.includes('..') &&
        this.isWorkspaceRootFile(normalizedPath)) {
      return true;
    }

    return false;
  }

  /**
   * 检查路径是否只读
   */
  isReadOnly(filePath) {
    const normalizedPath = path.normalize(filePath);

    if (this.isWorkspaceRootFile(normalizedPath)) {
      return true;
    }

    for (const readOnlyPath of this.readOnlyPaths) {
      if (normalizedPath.startsWith(readOnlyPath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查文件名或扩展名是否被禁止
   */
  isForbidden(filePath) {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);

    // 检查扩展名
    if (this.forbiddenExtensions.includes(ext)) {
      return true;
    }

    // 检查文件名模式
    for (const pattern of this.forbiddenPatterns) {
      if (pattern.test(fileName) || pattern.test(filePath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 过滤文件列表，移除隐藏和禁止访问的文件
   */
  filterFileList(files) {
    return files.filter(file => {
      const filePath = file.path || file;
      return this.isAllowed(filePath) && !this.isForbidden(filePath);
    });
  }

  /**
   * 验证读取操作
   */
  canRead(filePath) {
    return this.isAllowed(filePath) && !this.isForbidden(filePath);
  }

  /**
   * 验证写入操作
   */
  canWrite(filePath) {
    if (!this.isAllowed(filePath)) {
      return false;
    }

    if (this.isForbidden(filePath)) {
      return false;
    }

    if (this.isReadOnly(filePath)) {
      return false;
    }

    return true;
  }

  /**
   * 验证删除操作
   */
  canDelete(filePath) {
    // 删除权限与写入权限相同
    return this.canWrite(filePath);
  }

  /**
   * 获取访问控制错误消息
   */
  getAccessDeniedMessage(operation, filePath) {
    if (this.isHidden(filePath)) {
      return `访问被拒绝：该文件不存在或无权访问`;
    }

    if (this.isForbidden(filePath)) {
      return `访问被拒绝：该文件类型不允许访问`;
    }

    if (operation === 'write' && this.isReadOnly(filePath)) {
      return `访问被拒绝：该文件为只读文件`;
    }

    return `访问被拒绝：没有权限执行${operation}操作`;
  }
}

// 导出单例
module.exports = new WorkspaceAccessControl();
