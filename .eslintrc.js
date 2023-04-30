module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json"],
  },
  plugins: ["@typescript-eslint/eslint-plugin", "eslint-plugin-prettier"],
  extends: ["plugin:@typescript-eslint/recommended", "eslint-config-prettier"],
  rules: {
    "@typescript-eslint/no-namespace": "off",
  },
};
