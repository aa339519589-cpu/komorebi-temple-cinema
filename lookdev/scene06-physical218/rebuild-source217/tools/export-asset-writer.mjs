import {mkdir, writeFile, readFile, link, statfs} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

// Export filenames remain stable. Identical immutable payloads share storage
// within this new export only; live source assets are never linked or modified.
export async function createExportAssetWriter(directory, options = {}) {
 const root = resolve(directory);
 await mkdir(root, {recursive: true});
 const firstByDigest = new Map(), byName = new Map();
 const statistics = {files: 0, logicalBytes: 0, uniqueBytes: 0, linkedFiles: 0, savedBytes: 0};
 const maxUniqueBytes = options.maxUniqueBytes ?? Infinity;
 const minimumFreeBytes = options.minimumFreeBytes ?? 0;
 if (!(maxUniqueBytes > 0) || !(minimumFreeBytes >= 0)) throw Error('Invalid export storage bounds');
 let pending = Promise.resolve();
 async function save(name, bytes) {
  if (!/^[a-zA-Z0-9_.-]+$/.test(name) || name === '.' || name === '..') throw Error('Invalid export filename');
  if (!Buffer.isBuffer(bytes)) throw Error('Export asset must be a Buffer');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const prior = byName.get(name);
  if (prior) {
   if (prior.sha256 !== sha256 || prior.bytes !== bytes.length) throw Error('Conflicting export asset: ' + name);
   if (!(await readFile(resolve(root, name))).equals(bytes)) throw Error('Changed export asset: ' + name);
   return prior;
  }
  const destination = resolve(root, name), first = firstByDigest.get(sha256);
  if (first) {
   // Compare exact bytes too: do not assume a digest alone proves equality.
   if (!(await readFile(first)).equals(bytes)) throw Error('Export digest collision: ' + name);
   await link(first, destination); // EEXIST preserves all previous output.
   statistics.linkedFiles++;
   statistics.savedBytes += bytes.length;
  } else {
   if (statistics.uniqueBytes + bytes.length > maxUniqueBytes) throw Error('Unique export storage bound exceeded');
   if (minimumFreeBytes) {
    const disk = await statfs(root);
    if (disk.bavail * disk.bsize - bytes.length < minimumFreeBytes) throw Error('Minimum free export storage would be exceeded');
   }
   await writeFile(destination, bytes, {flag: 'wx', mode: 0o444});
   firstByDigest.set(sha256, destination);
   statistics.uniqueBytes += bytes.length;
  }
  const record = {bytes: bytes.length, sha256};
  byName.set(name, record);
  statistics.files++;
  statistics.logicalBytes += bytes.length;
  return record;
 }
 return {
  statistics,
  write(name, bytes) {
   // Browser callbacks can overlap. Serialize creation so duplicate bytes can
   // never race into independent files or overwrite a hard-linked payload.
   const result = pending.then(() => save(name, bytes));
   pending = result.catch(() => {});
   return result;
  }
 };
}
