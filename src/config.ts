// src/config.ts
import * as vscode from 'vscode';

export interface Configuration {
    model: string;
    apiKey?: string;
}

// Extension timing configuration
export const Timeouts = {
    CLEANUP: 1000, // 1 second for cleanup operations
    DEFAULT_ACTIVATION: 100, // 100ms default safety delay
    get ACTIVATION(): number {
        return parseInt(process.env.VSCODE_CLAUDE_ACTIVATION_TIMEOUT || '', 10) || this.DEFAULT_ACTIVATION;
    },
    STATUS_BAR_PRIORITY: 100
} as const;

/**
 * Waits for the extension to be ready after state changes
 * @param timeout Optional custom timeout (defaults to 3x activation timeout)
 */
export async function waitForExtensionReady(timeout?: number): Promise<void> {
    const waitTime = timeout || Math.max(Timeouts.ACTIVATION * 3, 500);
    await new Promise(resolve => setTimeout(resolve, waitTime));
}


export function getConfiguration(): Configuration {
    const config = vscode.workspace.getConfiguration('claude-vscode');
    return {
        model: config.get('model') || 'claude-3-opus-20240229',
        apiKey: config.get('apiKey')
    };
}

/**
 * Ensures all editor windows are closed
 * @param retries Number of retry attempts
 * @param delay Delay between retries in ms
 */
export async function ensureAllEditorsClosed(retries = 3, delay = 500): Promise<void> {
    for (let i = 0; i < retries; i++) {
        if (vscode.window.visibleTextEditors.length === 0) return;
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    if (vscode.window.visibleTextEditors.length > 0) {
        throw new Error('Failed to close all editors');
    }
}