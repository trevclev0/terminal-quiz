import { execSync } from "node:child_process";
import type { UserConfig } from "cz-git";
import { defineConfig } from "czg";

function getIssueFromBranch(): string {
  try {
    const branch = execSync("git branch --show-current").toString().trim();
    const match = branch.match(/(?:^|\/)(\d+)-/);
    return match ? `#${match[1]}` : "";
  } catch {
    return "";
  }
}

const config = defineConfig({
  extends: ["gitmoji"],
  rules: {
    "header-max-length": [2, "always", 100],
  },
  prompt: {
    useEmoji: true,
    emojiAlign: "left",
    issuePrefixes: [
      {
        value: "Refs",
        name: "Refs:   reference a GitHub issue without closing",
      },
      {
        value: "Closes",
        name: "Closes: close a GitHub issue on merge to main",
      },
    ],
    defaultIssues: getIssueFromBranch(),
    useAI: true,
  } as UserConfig["prompt"],
});

export default config;
