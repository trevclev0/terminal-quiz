import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateE2eSeedSql } from "./seedE2eData";

const outFile = path.join(import.meta.dirname, "generated", "seed-e2e.sql");

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, `${generateE2eSeedSql()}\n`, "utf-8");

console.log(`Generated ${path.relative(process.cwd(), outFile)}`);
