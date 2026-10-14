import {defineConfig} from 'vite';
import {execFileSync} from 'node:child_process';
// Source revision rather than GitHub's synthetic PR merge SHA.
const gitSha=()=>{try{return execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{return '';}};
const sha=process.env.MI001_COMMIT_SHA||process.env.VITE_COMMIT_SHA||gitSha();
export default defineConfig({define:{'import.meta.env.VITE_COMMIT_SHA':JSON.stringify(sha)}});
