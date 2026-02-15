import type { Config } from "jest";

const config: Config = {
  // Use ts-jest to handle TypeScript files
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",

  // extensions to treat as ESM
  extensionsToTreatAsEsm: [".ts"],

  // Transform settings
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },

  // Map .ts imports to .js (standard for ESM)
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  // Ignore node_modules
  transformIgnorePatterns: ["node_modules/(?!(.*))"],
};

export default config;
