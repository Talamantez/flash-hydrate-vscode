// test/suite/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as extension from '../../src/extension';
import { waitForExtensionReady, ensureAllEditorsClosed, unregisterCommands } from '../../src/utils';
import { ClaudeResponse } from '../../src/api';

interface ClaudeApiService {
    askClaude(text: string, token?: vscode.CancellationToken): Promise<any>;
}

suite('Claude Extension Test Suite', () => {
    let sandbox: sinon.SinonSandbox;
    let mockContext: vscode.ExtensionContext;

    suiteSetup(async () => {
        await extension.deactivate();
        await unregisterCommands(); // Ensure commands are unregistered before suite
        await waitForExtensionReady();
        await ensureAllEditorsClosed();
    });

    setup(async () => {
        sandbox = sinon.createSandbox();

        // Create basic mock context
        mockContext = {
            subscriptions: [],
            extensionPath: '',
            storagePath: '',
            globalStoragePath: '',
            logPath: '',
            extensionUri: vscode.Uri.file(''),
            globalStorageUri: vscode.Uri.file(''),
            logUri: vscode.Uri.file(''),
            storageUri: vscode.Uri.file(''),
            extensionMode: vscode.ExtensionMode.Test,
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                setKeysForSync: () => { },
                keys: () => []
            },
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                keys: () => []
            },
            secrets: {
                get: () => Promise.resolve(undefined),
                store: () => Promise.resolve(),
                delete: () => Promise.resolve(),
                onDidChange: new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event
            },
            environmentVariableCollection: {
                persistent: false,
                description: '',
                append: () => { },
                prepend: () => { },
                replace: () => { },
                clear: () => { },
                delete: () => false,
                forEach: () => { },
                get: () => undefined,
                [Symbol.iterator]: function* () { yield* []; },
                getScoped: () => ({
                    persistent: false,
                    description: '',
                    append: () => { },
                    prepend: () => { },
                    replace: () => { },
                    clear: () => { },
                    delete: () => false,
                    forEach: () => { },
                    get: () => undefined,
                    [Symbol.iterator]: function* () { yield* []; }
                })
            },
            extension: {
                id: 'test-extension',
                extensionUri: vscode.Uri.file(''),
                extensionPath: '',
                isActive: true,
                packageJSON: {},
                exports: undefined,
                activate: () => Promise.resolve(),
                extensionKind: vscode.ExtensionKind.Workspace
            },
            asAbsolutePath: (p: string) => p,
            // @ts-ignore
            languageModelAccessInformation: {}
        };

        await waitForExtensionReady();
    });

    teardown(async () => {
        sandbox.restore();
        await extension.deactivate();
        await unregisterCommands(); // Ensure commands are unregistered after each test
        await waitForExtensionReady();
        await ensureAllEditorsClosed();
    });

    suiteTeardown(async () => {
        await extension.deactivate();
        await unregisterCommands(); // Final cleanup of commands
        await waitForExtensionReady();
        await ensureAllEditorsClosed();
    });

    test('Scaffold Command Registration', async function () {
        this.timeout(45000);

        try {
            const mockResponse: ClaudeResponse = {
                content: [{
                    type: 'text',
                    text: 'Test scaffold response'
                }],
                id: 'test-id',
                model: 'claude-3-opus-20240229',
                role: 'assistant',
                stop_reason: null,
                stop_sequence: null,
                type: 'message',
                usage: { input_tokens: 0, output_tokens: 0 }
            };

            const mockApiService: ClaudeApiService = {
                askClaude: sinon.stub().resolves(mockResponse)
            };

            await extension.activate(mockContext, mockApiService);
            await waitForExtensionReady();

            // Verify command is registered
            const commands = await vscode.commands.getCommands();
            assert.ok(commands.includes('claude-vscode.scaffoldRepo'), 'Scaffold command should be registered');

        } catch (error) {
            console.error('Test failed:', error);
            throw error;
        }
    });

    test('Cancel Button Functionality', async function () {
        this.timeout(45000);

        let mockEditor: vscode.TextEditor | undefined;
        let responseEditor: vscode.TextEditor | undefined;

        try {
            const mockResponse: ClaudeResponse = {
                content: [{
                    type: 'text',
                    text: 'Request cancelled'
                }],
                id: 'test-id',
                model: 'claude-3-opus-20240229',
                role: 'assistant',
                stop_reason: 'cancelled',
                stop_sequence: null,
                type: 'message',
                usage: { input_tokens: 0, output_tokens: 0 }
            };

            const mockApiService: ClaudeApiService = {
                askClaude: sinon.stub().callsFake(async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return mockResponse;
                })
            };

            await extension.activate(mockContext, mockApiService);
            await waitForExtensionReady();

            // Create and show test document
            const doc = await vscode.workspace.openTextDocument({
                content: "Test selection",
                language: 'plaintext'
            });
            mockEditor = await vscode.window.showTextDocument(doc);
            await waitForExtensionReady();

            // Execute command and wait for response
            await vscode.commands.executeCommand('claude-vscode.scaffoldRepo');
            await waitForExtensionReady(1000);

            const editors = vscode.window.visibleTextEditors;
            responseEditor = editors.find(e => e.document.languageId === 'markdown');

            assert.ok(responseEditor, "Response editor should be created");
            const editorContent = responseEditor.document.getText();
            assert.ok(editorContent.includes('Request cancelled'), "Response should contain expected text");

        } catch (error) {
            console.error('Cancel button test failed:', error);
            throw error;
        } finally {
            // Cleanup
            if (mockEditor) {
                await vscode.window.showTextDocument(mockEditor.document);
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
            if (responseEditor) {
                await vscode.window.showTextDocument(responseEditor.document);
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
        }
    });
});