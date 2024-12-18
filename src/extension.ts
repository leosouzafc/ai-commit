import * as vscode from "vscode";
import { exec } from "child_process";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "ai-commit" is now active!');

  const disposable = vscode.commands.registerCommand(
    "ai-commit.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from ai-commit!");
    }
  );
  const generateMessage = vscode.commands.registerCommand(
    "ai-commit.generateMessage",
    async () => {
      try {
        vscode.window.showInformationMessage("Generating commit message...");
        await generateCommitMessage();
      } catch (error) {
        vscode.window.showErrorMessage(`Erro: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(generateMessage);
}
async function generateCommitMessage() {
  try {
    const diffs = await getStagedDiffs();
    const response = await fetch("http://localhost:8000/generate-commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diff: diffs,
        style: "semantic",
      }),
    });
    const data: any = await response.json();

    if (data.response) {
      vscode.window.showInformationMessage(data.response);
    } else {
      vscode.window.showErrorMessage("Falha ao gerar mensagem de commit.");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Erro ao gerar commit: ${error}`);
  }
}
function getStagedDiffs(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      "git diff --cached",
      { cwd: vscode.workspace.rootPath },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Erro ao executar git diff: ${error.message}`);
          return reject(error.message);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return reject(stderr);
        }
        resolve(stdout);
      }
    );
  });
}

export function deactivate() {}
