// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const removeMd = require('remove-markdown');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Copy Hover Type is now active!');

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

  let index: number;
  if (
    plainText.includes('function') ||
    plainText.includes('method') ||
    plainText.includes('alias')
  ) {
    const arrowIndex = plainText.indexOf('<');
    if (arrowIndex === -1) {
      index = plainText.substring(2).indexOf('(') + 2;
    } else {
      const bracketIndex = plainText.substring(2).indexOf('(') + 2;
      index = arrowIndex < bracketIndex ? arrowIndex : bracketIndex;
    }
  } else {
    index = plainText.indexOf(': ') + 2;
  }
  const lastIndex = getLastIndex(plainText);

  plainText = plainText.substring(index, lastIndex).trim();
  vscode.env.clipboard.writeText(plainText);
}
async function copyReturnType() {
  let plainText: string | undefined = await getPlainText();

  if (!plainText) {
    return;
  }
  const returnIndex = getReturnTypeIndex(plainText);
  const lastIndex = getLastIndex(plainText);

  plainText = plainText.substring(returnIndex, lastIndex).trim();
  vscode.env.clipboard.writeText(plainText);
}

async function getPlainText(): Promise<string | undefined> {
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

  const markdown = parts.join('\n---\n');
  return removeMarkddown(markdown);
}

function removeMarkddown(markdown: string) {
  const targetLanguageRegExp = new RegExp(/```(type|java)script/);
  if (targetLanguageRegExp.test(markdown)) {
    return markdown.replace(targetLanguageRegExp, '').replace(/```/, '');
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

function getLastIndex(plainText: string) {
  const returnTypeIndex = getReturnTypeIndex(plainText);
  const separatedText = plainText.substring(returnTypeIndex);
  if (separatedText.includes('overload')) {
    return separatedText.lastIndexOf('(') + returnTypeIndex;
  } else if (separatedText.includes('import')) {
    return separatedText.lastIndexOf('import') + returnTypeIndex;
  }
  return plainText.length;
}

function getReturnTypeIndex(plainText) {
  if (plainText.includes(': ')) {
    return plainText.lastIndexOf(': ') + 2;
  }
  return plainText.lastIndexOf('=> ') + 3;
}

// this method is called when your extension is deactivated
export function deactivate() {}
