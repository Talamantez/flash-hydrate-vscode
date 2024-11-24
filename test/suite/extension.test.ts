import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as extension from '../../src/extension';
import { waitForExtensionReady } from '../../src/utils';
import { ClaudeResponse } from '../../src/api';
import { thoroughCleanup } from '../../src/test-utils';

interface ClaudeApiService {
    askClaude(text: string, token?: vscode.CancellationToken): Promise<ClaudeResponse>;
}

suite('Flash Hydrate Extension Suite', function () {
    this.timeout(20000);

    let sandbox: sinon.SinonSandbox;
    let mockContext: vscode.ExtensionContext;
    let mockApiService: ClaudeApiService;
    let registerCommandStub: sinon.SinonStub;

    suiteSetup(async function () {
        console.log('🎬 Starting test suite setup...');
        await thoroughCleanup();
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✨ Test suite setup complete!');
    });

    setup(async function () {
        console.log('\n🔄 Setting up test...');

        // Create fresh sandbox for each test
        sandbox = sinon.createSandbox();

        // Create mock API service
        mockApiService = {
            askClaude: sandbox.stub().resolves({
                content: [{ type: 'text', text: 'Test response' }],
                id: 'test-id',
                model: 'claude-3-opus-20240229',
                role: 'assistant',
                stop_reason: null,
                stop_sequence: null,
                type: 'message',
                usage: { input_tokens: 0, output_tokens: 0 }
            })
        };

        // Create a single registerCommand stub that will be used throughout the test
        registerCommandStub = sandbox.stub(vscode.commands, 'registerCommand')
            .returns({ dispose: () => { console.log('🗑️ Mock command disposed'); } });

        // Create mock context with subscription tracking
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
                getScoped: () => ({})
            } as any,
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
            languageModelAccessInformation: {
                // @ts-ignore
                get: () => undefined
            }
        };

        console.log('✅ Test setup complete!');
    });

    teardown(async function () {
        console.log('\n🧹 Starting test cleanup...');

        // Restore sandbox
        sandbox.restore();
        console.log('✨ Sandbox restored');

        // Clean up extension
        try {
            await extension.deactivate();
            console.log('✅ Extension deactivated');
        } catch (error) {
            console.log('ℹ️ Extension was not active');
        }

        // Thorough cleanup
        await thoroughCleanup();
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✨ Test cleanup complete!');
    });

    test('Activation registers commands and initializes services', async function () {
        console.log('\n🧪 Testing extension activation...');

        await extension.activate(mockContext, mockApiService);
        await waitForExtensionReady(1000);

        assert.strictEqual(
            registerCommandStub.calledWith('claude-vscode.scaffoldRepo'),
            true,
            'Scaffold command should be registered'
        );

        assert.strictEqual(
            mockContext.subscriptions.length > 0,
            true,
            'Subscriptions should be registered for cleanup'
        );

        console.log('✅ Activation test completed successfully!');
    });

    // test/suite/extension.test.ts

    test('Deactivation cleans up resources properly', async function () {
        console.log('\n🧪 Testing extension deactivation...');

        // Create a spy for the dispose function
        const disposeSpy = sandbox.spy();

        // Create a disposable with the spy
        const testDisposable = {
            dispose: disposeSpy
        };

        // Create test context with the disposable
        const testContext: vscode.ExtensionContext = {
            ...mockContext,
            subscriptions: [testDisposable]
        };

        // Activate extension with test context
        await extension.activate(testContext, mockApiService);
        await waitForExtensionReady(1000);

        // Verify command registration
        assert.strictEqual(
            registerCommandStub.calledWith('claude-vscode.scaffoldRepo'),
            true,
            'Command should be registered'
        );

        // Deactivate and wait for cleanup
        await extension.deactivate();
        await waitForExtensionReady(2000); // Increased wait time

        // Verify disposable cleanup
        assert.strictEqual(
            disposeSpy.called,
            true,
            'Disposable.dispose() should be called during cleanup'
        );

        // Log cleanup details for debugging
        console.log('Dispose spy called:', disposeSpy.called);
        console.log('Call count:', disposeSpy.callCount);

        if (disposeSpy.called) {
            console.log('First call arguments:', disposeSpy.firstCall.args);
        }

        console.log('✅ Deactivation test completed successfully!');
    });
    test('Extension handles errors gracefully during activation', async function () {
        console.log('\n🧪 Testing error handling during activation...');

        // Mock an error in the API service
        const errorApiService: ClaudeApiService = {
            askClaude: sandbox.stub().rejects(new Error('API Error'))
        };

        // Activation should still succeed even with API service error
        await extension.activate(mockContext, errorApiService);
        await waitForExtensionReady(1000);

        assert.strictEqual(
            registerCommandStub.called,
            true,
            'Commands should be registered despite API error'
        );

        console.log('✅ Error handling test completed successfully!');
    });

    test('Extension respects VS Code lifecycle events', async function () {
        console.log('\n🧪 Testing VS Code lifecycle handling...');

        // Mock window state change
        const windowStateChangeEvent = new vscode.EventEmitter<void>();
        sandbox.stub(vscode.window, 'onDidChangeWindowState')
            .returns({ dispose: () => { } });

        await extension.activate(mockContext, mockApiService);

        // Simulate window state change
        windowStateChangeEvent.fire();
        await waitForExtensionReady(500);

        // Extension should still be stable
        assert.strictEqual(
            registerCommandStub.called,
            true,
            'Extension remains stable after window state change'
        );

        console.log('✅ Lifecycle handling test completed successfully!');
    });
});