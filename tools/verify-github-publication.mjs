import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const run=promisify(execFile),repo='aa339519589-cpu/komorebi-temple-cinema',tag='checkpoint-2026-10-16';
const api=async path=>JSON.parse((await run('gh',['api',path],{maxBuffer:4*1024*1024})).stdout);
const [repository,release,ref,license]=await Promise.all([api('repos/'+repo),api(`repos/${repo}/releases/tags/${tag}`),api(`repos/${repo}/git/ref/heads/main`),api(`repos/${repo}/contents/LICENSE?ref=main`)]);
assert.equal(repository.private,false);assert.equal(repository.visibility,'public');
const head=(await run('git',['rev-parse','HEAD'])).stdout.trim();assert.equal(ref.object.sha,head);
assert.deepEqual(Buffer.from(license.content,'base64'),await readFile('LICENSE'));
const manifest=JSON.parse(await readFile('archives/checkpoint-manifest.json','utf8'));
const manifestBytes=await readFile('.publication/checkpoint-manifest.json');
const expected=[...manifest.assets,{file:'checkpoint-manifest.json',bytes:manifestBytes.length,sha256:createHash('sha256').update(manifestBytes).digest('hex')}];
const verified=[];
for(const file of expected){
 const asset=release.assets.find(a=>a.name===file.file);assert(asset,`Missing asset ${file.file}`);
 assert.equal(asset.state,'uploaded');assert.equal(asset.size,file.bytes);assert.equal(asset.digest,'sha256:'+file.sha256);
 verified.push({name:asset.name,url:asset.browser_download_url,bytes:asset.size,sha256:file.sha256,githubDigestMatches:true});
}
const report={verifiedAt:new Date().toISOString(),scope:'Public GitHub visibility, exact pushed source commit, MIT license file and GitHub-computed digests for every checkpoint archive and inventory. This does not certify the visual reconstruction as complete.',repository:repository.html_url,public:true,license:'MIT',sourceCommit:head,release:release.html_url,prerelease:release.prerelease,originalFileCount:manifest.fileCount,originalBytes:manifest.originalBytes,assets:verified,passed:true};
await writeFile('archives/github-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({repository:report.repository,release:report.release,public:report.public,files:report.originalFileCount,assets:verified.length,passed:true},null,2));
