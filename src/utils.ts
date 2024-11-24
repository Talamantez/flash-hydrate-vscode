// === File: src/utils.ts ===
import * as vscode from 'vscode';
import { Timeouts } from './config';

const EXTENSION_COMMANDS = [
    'claude-vscode.scaffoldRepo'
] as const;

/**
 * Super strong force removal of a command
 */
async function forceRemoveCommand(command: string): Promise<void> {
    console.log(`🧹 Attempting to force remove command: ${command}`);

    // Strategy 1: Try standard disposal
    try {
        const dummy = vscode.commands.registerCommand(command, () => { });
        dummy.dispose();
        console.log('✨ Strategy 1: Standard disposal completed');
    } catch (error) {
        console.log('💭 Strategy 1 failed, trying next strategy...');
    }

    // Strategy 2: Wait for VS Code to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('⏳ Waited for VS Code to process changes');

    // Strategy 3: Verify removal
    const commands = await vscode.commands.getCommands();
    if (!commands.includes(command)) {
        console.log('🎉 Command successfully removed!');
        return;
    }

    console.log('⚠️ Command still exists after cleanup attempts');
}

/**
 * Unregisters all extension commands with improved cleanup
 */
export async function unregisterCommands(maxRetries = 3): Promise<void> {
    console.log('🧸 Starting command cleanup...');

    for (const command of EXTENSION_COMMANDS) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            console.log(`\n🔄 Cleanup attempt ${attempt + 1} for ${command}`);

            try {
                await forceRemoveCommand(command);
                const commands = await vscode.commands.getCommands();
                if (!commands.includes(command)) {
                    console.log(`✅ Successfully cleaned up ${command}`);
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('⏳ Waiting before next attempt...');

            } catch (error) {
                console.log(`❌ Cleanup attempt ${attempt + 1} failed:`, error);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    // Final wait to ensure VS Code is happy
    await waitForExtensionReady(Timeouts.ACTIVATION);
    console.log('🎯 Command cleanup completed!');
}

export async function waitForExtensionReady(timeout?: number): Promise<void> {
    const waitTime = timeout || Math.max(Timeouts.ACTIVATION * 3, 500);
    await new Promise(resolve => setTimeout(resolve, waitTime));
}
