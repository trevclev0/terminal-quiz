import fs from "node:fs/promises";
import path from "node:path";
import Ajv from "ajv";
import schema from "../schema.json" with { type: "json" };
import type { Program } from "../src/App.types";

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

async function aggregateQuizzes() {
  const programsDir = path.join(process.cwd(), "programs");
  const files = (await fs.readdir(programsDir))
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  const quizzes: Program[] = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(programsDir, file), "utf-8");
    const data: Program = JSON.parse(raw);
    if (!validate(data)) {
      throw new Error(
        `Schema validation failed for ${file}: ${JSON.stringify(validate.errors)}`,
      );
    }
    quizzes.push(data);
  }

  // Minify: JSON.stringify(data) without pretty-printing
  const minifiedAggregatedJson = JSON.stringify(quizzes);

  await fs.mkdir(".generated", { recursive: true });
  await fs.writeFile(".generated/programs.json", minifiedAggregatedJson);
}

aggregateQuizzes().catch((err) => {
  console.error(err);
  process.exit(1);
});
