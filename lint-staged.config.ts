const config = {
  "*.{js,jsx,ts,tsx}": [
    "pnpm biome check --write --no-errors-on-unmatched",
    "pnpm vitest related --run",
  ],
  "*.{json,jsonc}": ["pnpm biome check --write --no-errors-on-unmatched"],
  "*.{css,scss,less}": ["pnpm biome check --write --no-errors-on-unmatched"],
  "*.{md,mdx}": ["pnpm biome check --write --no-errors-on-unmatched"],
};

export default config;
