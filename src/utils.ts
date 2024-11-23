import * as vscode from 'vscode';
import { Timeouts } from './config';

/**
 * List of all extension commands that need to be managed
 */
const EXTENSION_COMMANDS = [
    'claude-vscode.scaffoldRepo'
] as const;

type ExtensionCommand = typeof EXTENSION_COMMANDS[number];

/**
 * Error class for command registration issues
 */
class CommandRegistrationError extends Error {
    constructor(message: string, public command: string) {
        super(message);
        this.name = 'CommandRegistrationError';
    }
}

/**
 * Unregisters all extension commands and verifies they are properly cleaned up
 * @throws {CommandRegistrationError} If commands cannot be unregistered
 * @returns {Promise<void>}
 */
export async function unregisterCommands(): Promise<void> {
    const existingCommands = await vscode.commands.getCommands();

    for (const command of EXTENSION_COMMANDS) {
        try {
            if (existingCommands.includes(command)) {
                // Register a dummy command to force disposal of the existing one
                const disposable = vscode.commands.registerCommand(command, () => { });
                disposable.dispose();

                // Verify command was actually unregistered
                const commandsAfter = await vscode.commands.getCommands();
                if (commandsAfter.includes(command)) {
                    throw new CommandRegistrationError(
                        `Failed to unregister command: ${command}`,
                        command
                    );
                }
            }
        } catch (error) {
            if (error instanceof CommandRegistrationError) {
                throw error;
            }
            // Wrap other errors
            throw new CommandRegistrationError(
                `Error while unregistering command ${command}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                command
            );
        }
    }

    // Wait for VS Code to process command disposals
    await waitForExtensionReady(Timeouts.ACTIVATION);
}

/**
 * Waits for the extension to be ready after state changes
 * @param timeout Optional custom timeout (defaults to 3x activation timeout)
 */
export async function waitForExtensionReady(timeout?: number): Promise<void> {
    const waitTime = timeout || Math.max(Timeouts.ACTIVATION * 3, 500);
    await new Promise(resolve => setTimeout(resolve, waitTime));
}

/**
 * Ensures all editor windows are closed
 * @param retries Number of retry attempts
 * @param delay Delay between retries in ms
 */
export async function ensureAllEditorsClosed(retries = 3, delay = 500): Promise<void> {
    for (let i = 0; i < retries; i++) {
        if (vscode.window.visibleTextEditors.length === 0) {
            return;
        }
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    if (vscode.window.visibleTextEditors.length > 0) {
        throw new Error('Failed to close all editors');
    }
}