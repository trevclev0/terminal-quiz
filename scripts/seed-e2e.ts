import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  generateE2eSeedSql,
  generatePreviewSessionPruneSql,
} from "./seedE2eData";

const outDir = path.join(import.meta.dirname, "generated");
const seed = generateE2eSeedSql();
// Preview only (seed:e2e:preview): the shared preview D1 has no cleanup
// cron, so its seed also prunes stale sessions (#345).
const prune = generatePreviewSessionPruneSql(new Date());
const files = {
  "seed-e2e.sql": seed,
  "seed-e2e-preview.sql": `${seed}\n${prune}`,
};

await mkdir(outDir, { recursive: true });
for (const [name, sql] of Object.entries(files)) {
  const outFile = path.join(outDir, name);
  await writeFile(outFile, `${sql}\n`, "utf-8");
  console.log(`Generated ${path.relative(process.cwd(), outFile)}`);
}
