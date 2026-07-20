import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDirectory = new URL('../dist/', import.meta.url);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  }));
  return nested.flat();
}

const outputPath = fileURLToPath(outputDirectory);
const files = (await filesIn(outputPath)).filter(file => !file.endsWith('checksums.txt')).sort();
const checksums = await Promise.all(files.map(async file => {
  const contents = await readFile(file);
  const hash = createHash('sha256').update(contents).digest('hex');
  return `${hash}  ${relative(outputPath, file).replaceAll('\\', '/')}`;
}));

await writeFile(join(outputPath, 'checksums.txt'), `${checksums.join('\n')}\n`);
