
// === File: test/suite/extension.test.ts ===
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as extension from '../../src/extension';
import { waitForExtensionReady, unregisterCommands } from '../../src/utils';
import { ClaudeResponse } from '../../src/api';

interface ClaudeApiService {
    askClaude(text: string, token?: vscode.CancellationToken): Promise<ClaudeResponse>;
}

suite('Claude Extension Test Suite', function () {
    this.timeout(20000); // Increased timeout for cleanup

    let sandbox: sinon.SinonSandbox;
    let mockContext: vscode.ExtensionContext;

    suiteSetup(async function () {
        console.log('🎬 Starting test suite setup...');

        // First deactivate if active
        try {
            await extension.deactivate();
            console.log('✅ Extension deactivated');
        } catch (error) {
            console.log('ℹ️ Extension was not active');
        }

        // Force cleanup any lingering commands
        await unregisterCommands();

        // Give VS Code extra time to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✨ Test suite setup complete!');
    });

    setup(async function () {
        console.log('\n🔄 Setting up test...');

        // Create fresh sandbox
        sandbox = sinon.createSandbox();

        // Mock command registration to prevent real registration
        sandbox.stub(vscode.commands, 'registerCommand').returns({
            dispose: () => { console.log('🗑️ Mock command disposed'); }
        });

        // Create mock context
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
            // @ts-ignore
            environmentVariableCollection: {
                getScoped: (scope: vscode.EnvironmentVariableScope) => ({}) as vscode.EnvironmentVariableCollection
            } as vscode.EnvironmentVariableCollection,
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
            asAbsolutePath: (p: string) => p
        };

        console.log('✅ Test setup complete!');
    });

    teardown(async function () {
        console.log('\n🧹 Starting test cleanup...');

        if (sandbox) {
            sandbox.restore();
            console.log('✨ Sandbox restored');
        }

        try {
            await extension.deactivate();
            console.log('✅ Extension deactivated');
        } catch (error) {
            console.log('ℹ️ Extension was not active');
        }

        await unregisterCommands();
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✨ Test cleanup complete!');
    });

    test('Scaffold Command Registration', async function () {
        console.log('\n🧪 Running Scaffold Command Registration test...');

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
            askClaude: sandbox.stub().resolves(mockResponse)
        };

        await extension.activate(mockContext, mockApiService);
        await waitForExtensionReady(1000);

        assert.strictEqual(
            (vscode.commands.registerCommand as sinon.SinonStub).calledWith('claude-vscode.scaffoldRepo'),
            true,
            'Scaffold command should be registered'
        );

        console.log('✅ Test completed successfully!');
    });
});