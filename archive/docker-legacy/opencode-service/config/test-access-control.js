/**
 * OpenCode 文件系统访问控制测试
 */

const accessControl = require('./access-control');

console.log('=== 文件系统访问控制测试 ===\n');

// 测试用例
const testCases = [
  // 客户可读写的目录
  { path: '/workspace/inputs/my-file.txt', read: true, write: true, desc: '客户输入文件' },
  { path: '/workspace/inputs/subfolder/data.json', read: true, write: true, desc: '客户输入子目录文件' },

  // 客户只读的目录
  { path: '/workspace/benchmark-accounts/account1.md', read: true, write: false, desc: '对标账号文件（只读）' },
  { path: '/workspace/outputs/result.docx', read: true, write: false, desc: '输出文件（只读）' },

  // 客户不可见的目录
  { path: '/opt/core-assets/system/config.yaml', read: false, write: false, desc: '核心资产（隐藏）' },
  { path: '/opt/core-assets/prompts/template.txt', read: false, write: false, desc: '提示词模板（隐藏）' },
  { path: '/workspace-internal/temp/cache.tmp', read: false, write: false, desc: '内部临时文件（隐藏）' },

  // 禁止访问的文件类型
  { path: '/workspace/inputs/.env', read: false, write: false, desc: '环境变量文件（禁止）' },
  { path: '/workspace/inputs/secret.key', read: false, write: false, desc: '密钥文件（禁止）' },
  { path: '/workspace/inputs/credentials.pem', read: false, write: false, desc: '凭证文件（禁止）' },

  // Workspace 根目录文件
  { path: '/workspace/README.md', read: true, write: false, desc: 'Workspace 根目录 README' },
];

// 执行测试
testCases.forEach(test => {
  console.log(`测试: ${test.desc}`);
  console.log(`路径: ${test.path}`);

  const canRead = accessControl.canRead(test.path);
  const canWrite = accessControl.canWrite(test.path);

  console.log(`  预期读取权限: ${test.read ? '允许' : '拒绝'}`);
  console.log(`  实际读取权限: ${canRead ? '允许' : '拒绝'} ${canRead === test.read ? '✓' : '✗'}`);

  console.log(`  预期写入权限: ${test.write ? '允许' : '拒绝'}`);
  console.log(`  实际写入权限: ${canWrite ? '允许' : '拒绝'} ${canWrite === test.write ? '✓' : '✗'}`);

  if (!canRead) {
    console.log(`  拒绝原因: ${accessControl.getAccessDeniedMessage('read', test.path)}`);
  }

  console.log('');
});

// 测试文件列表过滤
console.log('=== 文件列表过滤测试 ===\n');

const fileList = [
  '/workspace/inputs/file1.txt',
  '/workspace/outputs/result.pdf',
  '/opt/core-assets/system/config.yaml',
  '/workspace/inputs/.env',
  '/workspace-internal/temp/cache.tmp',
  '/workspace/benchmark-accounts/account.md',
];

console.log('原始文件列表:');
fileList.forEach(f => console.log(`  ${f}`));

const filtered = accessControl.filterFileList(fileList);

console.log('\n过滤后文件列表（客户可见）:');
filtered.forEach(f => console.log(`  ${f}`));

console.log('\n测试完成');
