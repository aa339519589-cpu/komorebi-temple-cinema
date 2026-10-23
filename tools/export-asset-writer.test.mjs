import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, stat, writeFile, rm, readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createExportAssetWriter} from './export-asset-writer.mjs';

async function workspace(t) {
 const root = await mkdtemp(join(tmpdir(), 'temple-export-writer-'));
 t.after(() => rm(root, {recursive: true, force: true}));
 return root;
}

test('concurrent duplicate geometry keeps every filename and byte with one inode', async t => {
 const root = await workspace(t), writer = await createExportAssetWriter(root);
 const payload = Buffer.from([0, 255, 17, 0, 99]);
 await Promise.all(Array.from({length: 20}, (_, i) => writer.write(`geometry-${i}.bin`, payload)));
 const records = await Promise.all(Array.from({length: 20}, (_, i) => stat(join(root, `geometry-${i}.bin`))));
 assert.equal(new Set(records.map(s => s.ino)).size, 1);
 for (let i = 0; i < 20; i++) assert.deepEqual(await readFile(join(root, `geometry-${i}.bin`)), payload);
 assert.deepEqual(writer.statistics, {files: 20, logicalBytes: 100, uniqueBytes: 5, linkedFiles: 19, savedBytes: 95});
});

test('different payloads remain independent and source buffers are untouched', async t => {
 const root = await workspace(t), writer = await createExportAssetWriter(root);
 const a = Buffer.from('first'), b = Buffer.from('other');
 await writer.write('a.bin', a); await writer.write('b.bin', b);
 assert.notEqual((await stat(join(root, 'a.bin'))).ino, (await stat(join(root, 'b.bin'))).ino);
 assert.equal(a.toString(), 'first'); assert.equal(b.toString(), 'other');
});

test('existing output and conflicting filenames are never overwritten', async t => {
 const root = await workspace(t), writer = await createExportAssetWriter(root);
 await writeFile(join(root, 'existing.bin'), 'keep');
 await assert.rejects(writer.write('existing.bin', Buffer.from('replace')), {code: 'EEXIST'});
 await writer.write('new.bin', Buffer.from('keep'));
 await assert.rejects(writer.write('new.bin', Buffer.from('replace')), /Conflicting/);
 assert.equal((await readFile(join(root, 'existing.bin'))).toString(), 'keep');
 assert.equal((await readFile(join(root, 'new.bin'))).toString(), 'keep');
});

test('storage cap counts unique bytes and retains completed files on failure', async t => {
 const root = await workspace(t), writer = await createExportAssetWriter(root, {maxUniqueBytes: 4});
 await writer.write('a.bin', Buffer.from('1234'));
 await writer.write('copy.bin', Buffer.from('1234'));
 await assert.rejects(writer.write('too-large.bin', Buffer.from('x')), /storage bound/);
 assert.deepEqual((await readdir(root)).sort(), ['a.bin', 'copy.bin']);
 assert.equal(writer.statistics.uniqueBytes, 4);
});

test('free-space floor and invalid paths fail before creating payloads', async t => {
 const root = await workspace(t), writer = await createExportAssetWriter(root, {minimumFreeBytes: Number.MAX_SAFE_INTEGER});
 await assert.rejects(writer.write('asset.bin', Buffer.from('x')), /Minimum free/);
 await assert.rejects(writer.write('../outside.bin', Buffer.from('x')), /filename/);
 assert.deepEqual(await readdir(root), []);
});
