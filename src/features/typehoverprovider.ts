import * as vscode from 'vscode'
import {InstanceManager} from '../extension'
import * as utils from "../utils"
const HOVER_NONE = "<none>"


export function hoverProvider(manager : InstanceManager) : vscode.HoverProvider {
    return {
        provideHover(document, position, token) {
            return new Promise<vscode.Hover>((resolve, reject) => {
                let fn = utils.getFilenameDriveUpper(document)
                const instance = manager.instanceOfFile(fn)

                if(instance) {
                    instance.api.getSymbolAtPoint(fn, document.offsetAt(position)).then((msg) => {
                        if(msg.type.fullName != HOVER_NONE)
                        {
                            resolve(new vscode.Hover(msg.type.fullName))
                        }
                        else
                        {
                            reject(msg.type.fullName)
                        }
                    })
                } else {
                    reject("No Ensime instance started for this file")
                }
            })
        }
    }
}