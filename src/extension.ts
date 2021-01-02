// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const removeMd = require('remove-markdown');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Copy-Hover is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let copyDisposable = vscode.commands.registerCommand(
    'extension.copyHover',
    copyHover
  );
  let copyTypeDisposable = vscode.commands.registerCommand(
    'extension.copyHoverType',
    copyType
  );
  let copyReturnTypeDisposable = vscode.commands.registerCommand(
    'extension.copyHoverReturnType',
    copyReturnType
  );

  context.subscriptions.push(copyDisposable);
  context.subscriptions.push(copyTypeDisposable);
  context.subscriptions.push(copyReturnTypeDisposable);
}

async function copyHover() {
  const plainText: string | undefined = await getPlainText();
  if (!plainText) {
    return;
  }
  vscode.env.clipboard.writeText(plainText);
}

async function copyType() {
  let plainText: string | undefined = await getPlainText();

  if (!plainText) {
    return;
  }
  let index = -1;
  if (plainText.includes('function') || plainText.includes('method')) {
    index = plainText.substring(2).indexOf('(') + 2;
  } else {
    index = plainText.indexOf(': ') + 2;
  }

  plainText = index !== -1 ? plainText.substring(index) : plainText;
  vscode.env.clipboard.writeText(plainText);
}
async function copyReturnType() {
  let plainText: string | undefined = await getPlainText();

  if (!plainText) {
    return;
  }
  let index = -1;
  if (plainText.includes('=> ')) {
    index = plainText.lastIndexOf('=> ') + 3;
  } else {
    index = plainText.lastIndexOf(': ') + 2;
  }
  plainText = index !== -1 ? plainText.substring(index) : plainText;
  vscode.env.clipboard.writeText(plainText);
}

async function getPlainText() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }
  const selection = activeEditor.document.getWordRangeAtPosition(
    activeEditor.selection.active
  );
  if (!selection) {
    return;
  }

  const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
    'vscode.executeHoverProvider',
    activeEditor.document.uri,
    activeEditor.selection.active
  );

  const parts = hovers
    ?.flatMap((hover) => hover.contents)
    .map((content) => getMarkdownValue(content))
    .filter((content) => content.length > 0);

  if (!parts?.length) {
    return;
  }

  const markdown = parts.join('\n');
  return removeMarkddown(markdown);
}

function removeMarkddown(markdown: string) {
  const delimiter = '```';
  const targetLanguageLength = 'typescript'.length;
  const firstIndex =
    markdown.indexOf(delimiter + 'typescript') !== -1
      ? markdown.indexOf(delimiter + 'typescript')
      : markdown.indexOf(delimiter + 'javascript');

  if (firstIndex !== -1) {
    const lastIndex = markdown.lastIndexOf(delimiter);
    return markdown.substring(
      firstIndex + delimiter.length + targetLanguageLength,
      lastIndex
    );
  }

  return removeMd(markdown);
}

function getMarkdownValue(content: vscode.MarkedString): string {
  if (typeof content === 'string') {
    return content;
  } else if (content instanceof vscode.MarkdownString) {
    return content.value;
  } else {
    const markdown = new vscode.MarkdownString();
    markdown.appendCodeblock(content.value, content.language);
    return markdown.value;
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
