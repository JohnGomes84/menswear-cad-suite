import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const lock=JSON.parse(readFileSync(new URL("../package-lock.json",import.meta.url),"utf8"));

test("external CAD integration has deterministic npm ci lockfile",()=>{
 assert.equal(lock.lockfileVersion,3);
 assert.equal(lock.packages[""].dependencies["@freesewing/core"],"4.0.0");
 assert.equal(lock.packages[""].dependencies["@freesewing/config"],"4.0.0");
 for(const [name,pkg] of Object.entries(lock.packages)){
  if(!name)continue;
  assert.ok(pkg.version,`missing version: ${name}`);
  assert.ok(pkg.integrity?.startsWith("sha512-"),`missing registry checksum: ${name}`);
  assert.ok(pkg.resolved?.startsWith("https://"),`missing registry URL: ${name}`);
 }
});

test("FreeSewing packages declare MIT, but license metadata gaps block automatic approval",()=>{
 const fs=Object.entries(lock.packages).filter(([name])=>name.includes("node_modules/@freesewing/"));
 assert.ok(fs.length>=7);
 for(const [name,pkg] of fs)assert.equal(pkg.license,"MIT",name);
 // Missing metadata does NOT imply an allowed license.
 const unclassified=Object.entries(lock.packages).filter(
  ([name,pkg])=>name&&!pkg.license
 ).map(([name])=>name);
 assert.ok(unclassified.includes("node_modules/hooks"));
 // Upstream/license-file audit is still REQUIRED before release.
});
