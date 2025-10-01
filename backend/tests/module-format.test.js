import test from 'node:test';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getJsFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    dirents.map(async (dirent) => {
      const entryPath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        return getJsFiles(entryPath);
      }
      if (dirent.isFile() && dirent.name.endsWith('.js')) {
        return [entryPath];
      }
      return [];
    })
  );
  return nested.flat();
}

test('source files use ESM syntax', async () => {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = await getJsFiles(srcDir);
  const offenders = [];

  for (const file of files) {
    const contents = await readFile(file, 'utf8');
    if (/module\.exports/.test(contents) || /\brequire\s*\(/.test(contents)) {
      offenders.push(path.relative(srcDir, file));
    }
  }

  if (offenders.length) {
    throw new Error(`Found CommonJS patterns in: ${offenders.join(', ')}`);
  }
});
