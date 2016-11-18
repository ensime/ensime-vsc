import * as vscode from 'vscode'
import {InstanceManager} from '../extension'
import * as utils from "../utils"

let diagnosticCollection = vscode.languages.createDiagnosticCollection("ensime-scala")
var diagnosticMap = {}
let documentMap : { [fileNamestring : string] : vscode.TextDocument} = {}

interface Note {
    file : string
    msg : string
    severity : any
    beg : number
    end : number
    line : number
    col : number
}

interface NoteMsg {
    notes : Note[]
}

export function register(manager: InstanceManager) : vscode.Disposable {
    vscode.workspace.textDocuments
        .filter((d) => d.languageId == "scala")
        .map((d) => documentMap[utils.getFilenameDriveUpper(d)] = d)

    return vscode.workspace.onDidSaveTextDocument((document) => {
        let fn = utils.getFilenameDriveUpper(document)
        documentMap[fn] = document;
        const instance = manager.instanceOfFile(fn)
        instance.api.typecheckFile(fn)
    })
}

export function addNotes(msg : NoteMsg) {

    for(var i = 0; i < msg.notes.length; i++)
    {
        let note = msg.notes[i]
        if(note.file.includes("dep-src"))
        {
            continue
        }
        diagnosticMap[note.file] = (diagnosticMap[note.file] || []).concat(noteToDiag(note).get() || [])
    }

    for (var file in diagnosticMap) {
        if (diagnosticMap.hasOwnProperty(file)) {
            var diagnostics = diagnosticMap[file];
            let uri = vscode.Uri.file(file)
            diagnosticCollection.set(uri, diagnostics)
        }
    }
}

export function clearNotes() {
    diagnosticCollection.clear()
    diagnosticMap = {}
}

function groupBy(arr : Array<any>, fn : (item : any) => any) : Map<any, Array<any>> {
    return arr.reduce((dict, item) => {
        let k = fn(item);
        (dict[k] = dict[k] || []).push(item)
    })
}

function noteSeverityToDiagSeverity(note : Note) {
    switch (note.severity.typehint) {
        case "NoteError":return vscode.DiagnosticSeverity.Error
        case "NoteWarn": return vscode.DiagnosticSeverity.Warning
        default: return vscode.DiagnosticSeverity.Information
    }
}

function noteToDiag(note : Note) : Option<vscode.Diagnostic> {
    let doc : vscode.TextDocument = documentMap[utils.getPathDriveUpper(vscode.Uri.file(note.file).fsPath)]

    if(!doc)
    {
        return Option.none
    }
    else
    {
        let start = doc.positionAt(note.beg)
        let end = doc.positionAt(note.end)

        let val = new vscode.Diagnostic(
            new vscode.Range(
                start,
                end
            ),
            note.msg,
            noteSeverityToDiagSeverity(note)
        )
        return new Option(val)
    }
}

class Option<T> {
    private value : T
    private isEmpty : boolean

    static none = new Option(null)

    constructor(val : T) {
        this.value = val;
        this.isEmpty = (val == null)
    }

    map<U>(func : (val : T) => U) {
        if(this.isEmpty)
        {
            return Option.none
        }
        else {
            return new Option(func(this.value))
        }
    }

    get() {
        return this.value;
    }
}