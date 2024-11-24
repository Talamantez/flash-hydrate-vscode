const esbuild = require("esbuild");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const esbuildProblemMatcherPlugin = {
    name: "esbuild-problem-matcher",
    setup(build) {
        build.onStart(() => {
            console.log("[watch] build started");
        });
        build.onEnd((result) => {
            if (result.errors.length > 0) {
                result.errors.forEach(({ text, location }) => {
                    console.error(`✘ [ERROR] ${text}`);
                    console.error(
                        `    ${location.file}:${location.line}:${location.column}:`,
                    );
                });
            }
            console.log("[watch] build finished");
        });
    },
};

/** @type {import('esbuild').BuildOptions} */
const sharedOptions = {
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    logLevel: "info",
    plugins: [esbuildProblemMatcherPlugin],
    external: ["vscode"],
};

/** @type {import('esbuild').BuildOptions} */
const extensionBuildOptions = {
    ...sharedOptions,
    entryPoints: ["src/extension.ts"],
    outfile: "dist/extension.js",
};

/** @type {import('esbuild').BuildOptions} */
const testBuildOptions = {
    ...sharedOptions,
    entryPoints: ["test/runTest.ts", "test/suite/index.ts", "test/suite/extension.test.ts"],
    outdir: "dist/test",
    format: "cjs",
};

async function build() {
    try {
        if (watch) {
            // Create contexts for both builds
            const extensionCtx = await esbuild.context(extensionBuildOptions);
            const testCtx = await esbuild.context(testBuildOptions);
            
            // Start watching both contexts
            await Promise.all([
                extensionCtx.watch(),
                testCtx.watch()
            ]);
            
            console.log("Watching extension and test files...");
        } else {
            // Run both builds
            await Promise.all([
                esbuild.build(extensionBuildOptions),
                esbuild.build(testBuildOptions)
            ]);
        }
    } catch (err) {
        console.error("Build failed:", err);
        process.exit(1);
    }
}

build();