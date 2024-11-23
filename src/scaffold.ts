// src/scaffold.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeResponse } from './api';

interface RepoItem {
    type: 'file' | 'directory';
    path: string;
    content?: string;
}

/**
 * Parses the repo structure from Claude's response
 * @param text The response text containing repo structure
 * @returns An array of parsed repo items
 */
function parseRepoStructure(text: string): RepoItem[] {
    const lines = text.split('\n');
    const items: RepoItem[] = [];
    let currentFile: RepoItem | null = null;
    let fileContent: string[] = [];

    for (const line of lines) {
        // Check for file header pattern like "=== File: /path/to/file ==="
        const fileMatch = line.match(/^=== File: (.*?) ===$/);
        if (fileMatch) {
            // Save previous file if exists
            if (currentFile) {
                currentFile.content = fileContent.join('\n');
                items.push(currentFile);
                fileContent = [];
            }

            // Start new file
            currentFile = {
                type: 'file',
                path: fileMatch[1],
                content: ''
            };
            continue;
        }

        // If we're inside a file definition, collect content
        if (currentFile) {
            fileContent.push(line);
        }
    }

    // Save the last file if exists
    if (currentFile && fileContent.length > 0) {
        currentFile.content = fileContent.join('\n');
        items.push(currentFile);
    }

    return items;
}

/**
 * Creates directories recursively if they don't exist
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        await fs.promises.access(dirPath);
    } catch {
        await fs.promises.mkdir(dirPath, { recursive: true });
    }
}

/**
 * Scaffolds a repository based on Claude's response
 * @param response The Claude response containing repo structure
 */
export async function scaffoldRepository(response: ClaudeResponse): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder found. Please open a workspace first.');
    }
    const rootPath = workspaceFolders[0].uri.fsPath;

    // Parse repository structure from Claude's response
    const repoStructure = parseRepoStructure(response.content[0].text);

    // Create files and directories
    for (const item of repoStructure) {
        const itemPath = path.join(rootPath, item.path);
        const itemDir = path.dirname(itemPath);

        // Ensure parent directory exists
        await ensureDirectoryExists(itemDir);

        if (item.type === 'file' && item.content !== undefined) {
            try {
                await fs.promises.writeFile(itemPath, item.content);
            } catch (error) {
                console.error(`Error writing file ${itemPath}:`, error);
                throw error;
            }
        }
    }
}