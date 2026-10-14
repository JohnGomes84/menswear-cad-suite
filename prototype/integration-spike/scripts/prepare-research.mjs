import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// This is build tooling for the isolated research spike, not pattern logic.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const tool = join(root, "prototype/web-app/node_modules/.bin", process.platform === "win32" ? "esbuild.cmd" : "esbuild");
if (!existsSync(tool)) {
  console.error("Ferramenta esbuild ausente. Execute: npm ci --prefix prototype/web-app");
  process.exit(1);
}
const generated = join(root, "prototype/integration-spike/generated");
mkdirSync(generated, { recursive: true });
const entries = [
  ["flatTrouserBackResearch.ts", "aldch02.mjs"],
  ["garmentSemantics.ts", "garmentSemantics.mjs"],
  ["ch02BookLineCommands.ts", "ch02BookLines.mjs"]
];
for (const [source, target] of entries) {
  const result = spawnSync(tool, [
    join(root, "prototype/web-app/src", source),
    "--bundle", "--platform=node", "--format=esm",
    "--outfile=" + join(generated, target)
  ], { cwd: root, stdio: "inherit" });
  if (result.error || result.status !== 0) {
    console.error("Falha ao preparar módulo isolado", source, result.error?.message ?? result.status);
    process.exit(1);
  }
}
console.log("Módulos de pesquisa gerados; ainda não existe molde de corte aprovado.");
