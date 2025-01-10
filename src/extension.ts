import * as vscode from "vscode";
import { exec } from "child_process";
import { ApiResponse, ApiErrorResponse, ApiSuccessResponse } from "./types/api";

export function activate(context: vscode.ExtensionContext) {
  const scm = vscode.scm.createSourceControl("ai-commit", "ai-commit");
  const inputBox = scm.inputBox;
  const resourceGroup = scm.createResourceGroup("main", "Main Group");
  resourceGroup.resourceStates = [];
  scm.statusBarCommands = [
    {
      command: "ai-commit.generateMessage",
      title: "Gerar mensagem",
      tooltip: "Clique para gerar uma mensagem de commit",
    },
  ];

  const generateMessage = vscode.commands.registerCommand(
    "ai-commit.generateMessage",
    async () => {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Generating commit message...",
            cancellable: false,
          },
          async () => {
            const result = await generateCommitMessage();
            if (result) {
              inputBox.value = result;
            }
          }
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Erro: ${error}`);
      }
    }
  );
  const updateJWT = vscode.commands.registerCommand(
    "ai-commit.updateJWT",
    async () => {
      const jwt = await vscode.window.showInputBox({
        prompt: "Insira o JWT da sua conta do FCopilot",
        ignoreFocusOut: true,
        placeHolder: "your-jwt-token",
      });
      if (jwt) {
        vscode.workspace.getConfiguration("ai-commit").update("jwt", jwt, true);
        vscode.window.showInformationMessage("JWT atualizado com sucesso");
      }
    }
  );
  context.subscriptions.push(scm, generateMessage, updateJWT);
}

function isApiErrorResponse(
  response: ApiResponse
): response is ApiErrorResponse {
  return (response as ApiErrorResponse).detail !== undefined;
}

async function generateCommitMessage(): Promise<string | undefined> {
  try {
    const jwtToken = vscode.workspace
      .getConfiguration("ai-commit")
      .get<string>("jwt");
    const diffs = await getStagedDiffs();
    const response = await fetch(
      "https://fcopilot.fcamara.com/api/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          model: "orange-assistant",
          stream: false,
          messages: [
            {
              role: "user",
              content: `Você é um gerador automático de mensagens de commit. Sua tarefa é analisar as diferenças de código (diffs) fornecidas e gerar uma mensagem de commit seguindo o padrão de Commits Convencionais. A mensagem deve incluir o tipo, o escopo opcional e uma descrição clara e breve das alterações realizadas, não mais que uma linha, não pule linha e escreva um novo parágrafo. Caso você não tenha informações corretas ou um diff, responda 'Não foi possível gerar a mensagem'. Diffs: ${diffs}. `,
            },
          ],
        }),
      }
    );
    const data: ApiResponse = (await response.json()) as ApiResponse;
    if (isApiErrorResponse(data)) {
      if (data.detail === "401 Unauthorized") {
        vscode.window.showWarningMessage(
          "Sua autenticação expirou ou é inválida. Atualize o JWT."
        );
        await vscode.commands.executeCommand("ai-commit.updateJWT");
        vscode.window.showWarningMessage("Tente novamente");
        return;
      }
      vscode.window.showErrorMessage(`Erro: ${data.detail}`);
      return;
    }

    if (data.choices) {
      return data.choices[0].message.content;
    }

    vscode.window.showErrorMessage("Falha ao gerar mensagem de commit.");
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
          return reject(error.message);
        }
        if (stderr) {
          return reject(stderr);
        }
        resolve(stdout);
      }
    );
  });
}

export function deactivate() {}
