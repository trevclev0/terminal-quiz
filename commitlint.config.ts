import { execSync } from "node:child_process";
import type { UserConfig } from "cz-git";
import { defineConfig } from "czg";

type BrachDetails = {
  commitType: string;
  issueId: string;
};

const useAI = process.env.CZG_AI_ENABLED === "true";

function getTypeAndIssueFromBranch(): BrachDetails | null {
  try {
    const branch = execSync("git branch --show-current").toString().trim();
    const match = branch.match(/^(?<type>\w+)\/(?<issueId>\d+)-/);
    if (match?.groups) {
      return {
        commitType: match?.groups.type,
        issueId: `#${match.groups.issueId}`,
      };
    }
  } catch {
    return null;
  }
  return null;
}

const branchDetails = getTypeAndIssueFromBranch();

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
    defaultIssues: branchDetails?.issueId,
    defaultType: branchDetails?.commitType,
    defaultFooterPrefix: "Refs",
    useAI,
  } as UserConfig["prompt"],
});

export default config;
