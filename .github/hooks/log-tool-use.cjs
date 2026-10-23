// Optional VS Code Local-harness hook. Logs tool name and timestamp only.
// Do not treat this as an approval gate or security boundary.
const fs = require('node:fs');
const path = require('node:path');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(input);
    const logPath = path.join('.github', 'hooks', 'tool-use.log');
    const line = `${event.timestamp || new Date().toISOString()} ${String(event.tool_name || 'unknown-tool').replace(/[\r\n]/g, '')}\n`;
    fs.appendFileSync(logPath, line, { encoding: 'utf8' });
    process.stdout.write(JSON.stringify({ continue: true }));
  } catch (error) {
    // Fail open for this audit-only hook so a logging issue does not block work.
    process.stdout.write(JSON.stringify({ continue: true }));
  }
});
