// Launches Electron with electron/main.js as the entry.
//
// Exists because VS Code's integrated terminal exports ELECTRON_RUN_AS_NODE=1,
// which makes the electron binary boot as plain Node and crash. Electron checks
// whether that variable is *present*, not its value, so it has to be deleted —
// cross-env can only set it to an empty string.
const path = require('path');
const { spawn } = require('child_process');

const electronBinary = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(
  electronBinary,
  [path.join(__dirname, '..', 'electron', 'main.js'), ...process.argv.slice(2)],
  { stdio: 'inherit', env }
);

child.on('close', (code) => process.exit(code == null ? 0 : code));
