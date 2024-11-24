// src/extension.ts
import * as vscode from 'vscode';
import { ClaudeApiService, DefaultClaudeApiService } from './services/claude-api';
import { Timeouts } from './config';
import { unregisterCommands, waitForExtensionReady } from './utils';
import { scaffoldRepository } from './scaffold';

let apiService: ClaudeApiService;

// Track disposables at module level
let extensionDisposables: vscode.Disposable[] = [];
/**
 * Handles Claude API requests to scaffold a repository
 */
async function handleScaffoldRequest() {
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        Timeouts.STATUS_BAR_PRIORITY
    );
    statusBarItem.text = "$(sync~spin) Scaffolding repository...";
    statusBarItem.show();

    try {
        const prompt = await vscode.window.showInputBox({
            prompt: "Describe the repository you want to scaffold",
            placeHolder: "e.g., A React app with TypeScript for managing todo lists",
            ignoreFocusOut: true // Keep input box open when focus shifts
        });

        if (!prompt) {
            vscode.window.showInformationMessage('Repository description is required');
            return;
        }

        vscode.window.showInformationMessage(`Got prompt: ${prompt}`); // Debug feedback
        // Construct a detailed prompt for Claude
        const structuredPrompt = `Please create a repository structure based on this description: "${prompt}"`;

        const tokenSource = new vscode.CancellationTokenSource();

        const response = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Scaffolding Repository...',
            cancellable: true
        }, async (progress, progressToken) => {
            progressToken.onCancellationRequested(() => {
                tokenSource.cancel();
            });
            progress.report({ message: 'Generating repository structure...' });
            const result = await apiService.askClaude(structuredPrompt, tokenSource.token);

            progress.report({ message: 'Creating files...' });
            return result;
        });

        await scaffoldRepository(response);

        // Show success message with next steps
        const nextSteps = await vscode.window.showInformationMessage(
            'Repository scaffolded successfully! Would you like to install dependencies?',
            'Yes', 'No'
        );

        if (nextSteps === 'Yes') {
            // Open integrated terminal and run npm install
            const terminal = vscode.window.createTerminal('Scaffold');
            terminal.show();
            terminal.sendText('npm install');
        }

    } catch (error) {
        if (error instanceof vscode.CancellationError) {
            vscode.window.showInformationMessage('Scaffolding cancelled');
            return;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Error: ${errorMessage}`);
        console.error('Error scaffolding repository:', error);
    } finally {
        statusBarItem.dispose();
    }
}

/**
 * Activates the extension
 */
export async function activate(context: vscode.ExtensionContext, service?: ClaudeApiService) {
    console.log('Flash Hydrate extension activating...');

    try {
        // Initialize API service 
        apiService = service || new DefaultClaudeApiService();
        console.log('API service initialized');

        // Register the scaffold command
        const scaffoldCommand = vscode.commands.registerCommand('claude-vscode.scaffoldRepo', async () => {
            console.log('Scaffold command triggered');
            await handleScaffoldRequest();
        });

        // Track in both places
        context.subscriptions.push(scaffoldCommand);
        extensionDisposables.push(scaffoldCommand);

        // Track any additional disposables from context
        extensionDisposables.push(...context.subscriptions);

        console.log('Flash Hydrate extension activated successfully');

    } catch (error) {
        console.error('Error during activation:', error);
        throw error;
    } finally {
        await waitForExtensionReady();
    }
}

/**
 * Deactivates the extension 
 */
export async function deactivate() {
    console.log('Flash Hydrate extension deactivating...');

    try {
        // Clean up commands first
        await unregisterCommands();

        // Then dispose of all tracked disposables
        console.log(`Cleaning up ${extensionDisposables.length} disposables...`);

        for (const disposable of extensionDisposables) {
            try {
                if (disposable && typeof disposable.dispose === 'function') {
                    disposable.dispose();
                    console.log('Disposed of resource successfully');
                }
            } catch (error) {
                console.error('Error disposing resource:', error);
            }
        }

        // Clear the array
        extensionDisposables = [];

    } catch (error) {
        console.error('Error during deactivation cleanup:', error);
    }
}