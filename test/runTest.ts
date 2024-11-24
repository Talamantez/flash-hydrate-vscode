
// === File: test/runTest.ts ===
import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import * as fs from 'fs';

async function setupTestEnvironment() {
    // Ensure temp directories exist
    const dirs = [
        '/tmp/.X11-unix',
        '/tmp/vscode-test-workspace',
        path.join(process.env.HOME || '/root', '.cache/dconf')
    ];

    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    // Set required environment variables
    process.env.DISPLAY = ':99.0';
    process.env.DBUS_SESSION_BUS_ADDRESS = 'disabled';
    process.env.SHELL = '/bin/bash';
}

async function main() {
    try {
        console.log('🐻 Setting up test environment...');
        await setupTestEnvironment();

        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        console.log('🌲 Starting VS Code tests...');
        const testOptions = {
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                '--disable-extensions',
                '--disable-gpu',
                '--no-sandbox',
                '--disable-updates',
                '--disable-workspace-trust',
                '--skip-welcome',
                '--skip-release-notes',
                '--disable-telemetry',
                '--crash-reporter-directory=/tmp/vscode-crashes'
            ],
            extensionTestsEnv: {
                DISPLAY: ':99.0',
                DBUS_SESSION_BUS_ADDRESS: 'disabled',
                VSCODE_SKIP_PRELAUNCH: '1'
            }
        };

        await runTests(testOptions);
        console.log('✨ Tests completed successfully!');

    } catch (err) {
        console.error('🚨 Failed to run tests:', err);
        if (err instanceof Error) {
            console.error('Error details:', err.message);
            console.error('Stack trace:', err.stack);
        }
        process.exit(1);
    }
}

// Make sure we catch any unhandled errors
process.on('uncaughtException', (err) => {
    console.error('💥 Unhandled exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled promise rejection:', err);
    process.exit(1);
});

main();
