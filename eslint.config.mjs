import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...nextConfig,
  {
    ignores: ["coverage/", "playwright-report/", "convex/_generated/"],
  },
  {
    // Disable overly strict rules for gradual adoption
    rules: {
      // Allow unescaped quotes in JSX - common in text content
      "react/no-unescaped-entities": "off",
      // Disable React 19 compiler purity rules - too strict for existing code
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      // Allow anonymous default exports (common in configs)
      "import/no-anonymous-default-export": "off",
    },
  },
];

export default config;
