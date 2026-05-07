/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: semantic-release needs them because lodash injects the */
/** @type {import('semantic-release').GlobalConfig} */
const config = {
  branches: ["main"],
  tagFormat: "v${version}", // this is the default; safe to remove if you prefer implicit

  plugins: [
    [
      "semantic-release-gitmoji",
      {
        releaseRules: {
          major: [":boom:"],
          minor: [":sparkles:"],
          patch: [
            ":bug:",
            ":ambulance:",
            ":lock:",
            ":lipstick:",
            ":zap:",
            ":recycle:",
          ],
        },
      },
    ],

    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],

    [
      "@semantic-release/github",
      {
        assets: [
          {
            path: "dist/**",
            label: "Build Assets",
          },
        ],
      },
    ],

    [
      "@semantic-release/git",
      {
        assets: ["package.json"],
        message:
          ":bookmark: chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};

export default config;
