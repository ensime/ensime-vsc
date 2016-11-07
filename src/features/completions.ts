import * as vscode from 'vscode'
import {instanceManager} from '../extension'
import logapi = require("loglevel")
import * as utils from "../utils"
import * as ensimeClient from "ensime-client"

const log = logapi.getLogger('ensime.completions')

function determineItemKind(completion : ensimeClient.serverProtocol.Completion) : vscode.CompletionItemKind | undefined {
    var kind = undefined
    if(completion.typeInfo)
    {
        switch(completion.typeInfo.declAs)
        {
            case ensimeClient.serverProtocol.DeclaredAs.Class:
                kind = vscode.CompletionItemKind.Class
                break
            case ensimeClient.serverProtocol.DeclaredAs.Field:
                kind = vscode.CompletionItemKind.Field
                break
            case ensimeClient.serverProtocol.DeclaredAs.Interface:
                kind = vscode.CompletionItemKind.Interface
                break
            case ensimeClient.serverProtocol.DeclaredAs.Method:
                kind = vscode.CompletionItemKind.Method
                break
            case ensimeClient.serverProtocol.DeclaredAs.Nil:
                kind = vscode.CompletionItemKind.Value
            case ensimeClient.serverProtocol.DeclaredAs.Object:
                kind = vscode.CompletionItemKind.Module
            case ensimeClient.serverProtocol.DeclaredAs.Trait:
                kind = vscode.CompletionItemKind.Interface
        }
    }
    return kind
}

export function completionsProvider()  {

    const provider : vscode.CompletionItemProvider = {

		provideCompletionItems(document: vscode.TextDocument,
                position: vscode.Position,
                token: vscode.CancellationToken): Thenable<vscode.CompletionList> {
            log.debug('provideCompletionItems called for ', document.fileName)
            const instance = instanceManager.instanceOfFile(utils.getFilenameDriveUpper(document))
            if(instance) {
                return instance.api.getCompletions(utils.getFilenameDriveUpper(document), document.getText(), document.offsetAt(position), 30).then(response => {
                    log.debug('completions received: ', response.completions)
                    const completions = response.completions.map(completion => {
                        log.debug(completion)
                        let detail =
                            completion.typeInfo ? completion.typeInfo.fullName : ""
                        let toInsert =
                            completion.toInsert ? completion.toInsert : completion.name

                        let c = new vscode.CompletionItem(toInsert)
                        c.detail = detail
                        c.kind = determineItemKind(completion)
                        return c
                    })
                    return new vscode.CompletionList(completions, true)
                })
            } else {
                return new Promise((r, _) => r([]))
            }
        }


	}

    log.debug('registering completions provider: ', provider)
    return provider
}
