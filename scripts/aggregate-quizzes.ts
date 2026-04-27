import fs from "node:fs/promises";
import path from "node:path";
import Ajv from "ajv";
import schema from "../schema.json";

const ajv = new Ajv();
const validate = ajv.compile(schema);

async function aggregateQuizzes() {
  const programsDir = path.join(process.cwd(), "programs");
  const files = await fs.readdir(programsDir);

  const quizzes = [];
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const raw = await fs.readFile(path.join(programsDir, file), "utf-8");
    const data = JSON.parse(raw);
    if (!validate(data)) {
      console.error("Validation errors:", validate.errors);
      process.exit(1);
    }
    quizzes.push(data);
  }

  // Minify: JSON.stringify(data) without pretty-printing
  const minifiedJsonFiles = JSON.stringify(quizzes);

  await fs.mkdir(".generated", { recursive: true });
  await fs.writeFile(".generated/programs.json", minifiedJsonFiles);
}

aggregateQuizzes().catch(console.error);
