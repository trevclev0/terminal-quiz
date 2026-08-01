import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateSeedSql } from "./seedData";

const outFile = path.join(import.meta.dirname, "generated", "seed.sql");

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, `${generateSeedSql()}\n`, "utf-8");

console.log(`Generated ${path.relative(process.cwd(), outFile)}`);
