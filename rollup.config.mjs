import typescript from "rollup-plugin-typescript2";
import terser from "@rollup/plugin-terser";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { importAsString } from "rollup-plugin-string-import";

const plugins = [
    typescript({
        tsconfig: "./tsconfig.json",
        useTsconfigDeclarationDir: true
    }),
    resolve(), // Include `node_modules`
    commonjs(),
    importAsString({
        include: [
            "**/Fastfile",
            "**/Matchfile",
            "**/Appfile",
            "**/*.plist",
            "**/Gemfile",
        ],
    }),
]

/**
 * This config values that defines about rollup compile options.
 * @type {import("rollup").RollupOptions}
 */
export default {
    plugins: plugins,
    input: "./src/index.ts",
    output: [
        { file: "./dist/index.esm.js", format: "esm", name: "YourProjectName" }
    ]
}
