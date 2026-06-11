const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || '/workspace';
const CORE_ASSETS_DIR = process.env.CORE_ASSETS_DIR || '/opt/core-assets';
const TENANT_ID = process.env.TENANT_ID || 'unknown';

function listDirectory(dir) {
  try {
    return fs.readdirSync(dir);
  } catch (err) {
    return null;
  }
}

function canRead(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.R_OK);
    return true;
  } catch (err) {
    return false;
  }
}

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      tenant: TENANT_ID,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  if (req.url === '/info') {
    const info = {
      tenant_id: TENANT_ID,
      workspace_dir: WORKSPACE_DIR,
      core_assets_dir: CORE_ASSETS_DIR,
      workspace_structure: listDirectory(WORKSPACE_DIR),
      core_assets_exists: fs.existsSync(CORE_ASSETS_DIR),
      core_assets_readable: canRead(CORE_ASSETS_DIR),
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(info, null, 2));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <html>
      <head>
        <title>AI Self-Media System - ${TENANT_ID}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          .info { background: #f0f0f0; padding: 20px; border-radius: 5px; }
          .success { color: green; }
          pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>AI Self-Media SaaS - Test Build</h1>
        <div class="info">
          <p><strong>Tenant ID:</strong> ${TENANT_ID}</p>
          <p><strong>Workspace:</strong> ${WORKSPACE_DIR}</p>
          <p><strong>Core Assets:</strong> ${CORE_ASSETS_DIR}</p>
          <p><strong>Status:</strong> <span class="success">Running</span></p>
        </div>
        <h2>Endpoints</h2>
        <ul>
          <li><a href="/health">/health</a></li>
          <li><a href="/info">/info</a></li>
        </ul>
        <h2>Scope</h2>
        <ul>
          <li>Built-in core assets for isolation checks</li>
          <li>Workspace structure initialization</li>
          <li>Access control script validation</li>
          <li>No real OpenCode web runtime in this test build</li>
        </ul>
      </body>
    </html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Tenant: ${TENANT_ID}`);
  console.log(`Workspace: ${WORKSPACE_DIR}`);
  console.log(`Core Assets: ${CORE_ASSETS_DIR}`);
});
