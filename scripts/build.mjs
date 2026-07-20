import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDirectory);
const manifestPath = join(projectRoot, 'rust', 'Cargo.toml');
const releaseArtifact = join(
  projectRoot,
  'rust',
  'target',
  'wasm32-unknown-unknown',
  'release',
  'fyr_engine.wasm',
);
const distDirectory = join(projectRoot, 'dist');
const distArtifact = join(distDirectory, 'fyr-engine.wasm');
const windowsCargo = join(homedir(), '.cargo', 'bin', 'cargo.exe');
const cargo = process.env.CARGO
  ?? (process.platform === 'win32' && existsSync(windowsCargo) ? windowsCargo : 'cargo');

const result = spawnSync(
  cargo,
  ['build', '--manifest-path', manifestPath, '--target', 'wasm32-unknown-unknown', '--release'],
  { cwd: projectRoot, stdio: 'inherit' },
);

if (result.error) {
  throw new Error(`Unable to run Cargo: ${result.error.message}`);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (!existsSync(releaseArtifact)) {
  throw new Error(`Cargo completed without producing ${releaseArtifact}`);
}

mkdirSync(distDirectory, { recursive: true });
copyFileSync(releaseArtifact, distArtifact);
console.log(`Copied ${releaseArtifact} to ${distArtifact}`);
