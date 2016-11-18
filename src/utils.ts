import * as vscode from 'vscode';
import * as path from 'path'
import * as process from 'process'
import * as which from 'which'

export function isScalaSource(editor : vscode.TextEditor) {
    return (path.extname(editor.document.fileName) in ['.scala'])
}

export function withSbt(callback, globalState : vscode.Memento) {
    let configName = 'Ensime.sbtExec'
    let sbtCmd = vscode.workspace.getConfiguration(configName).toString() || globalState.get(configName)

    if(sbtCmd)
    {
        callback(sbtCmd)
    }
    else
    {
        //First check PATH
        which('sbt', (er, path) => {
            if(er)
            {
                //TODO: Give user option of manually locating sbt executable
                //Finally, make user manually get find sbtExec
                vscode.window.showErrorMessage("Could not find SBT executable. Please add SBT to %PATH% or using User Settings (Preferences -> User Settings)")
            }
            else
            {
                globalState.update(configName, path)
                callback(path)
            }
        })
    }
}


export function mkClasspathFilename(scalaVersion, ensimeServerVersion) {
    return path.join(packageDir(), `classpath_${scalaVersion}_${ensimeServerVersion}`)
}

export function mkAssemblyJarFilename(scalaEdition, ensimeServerVersion) {
    return path.join( packageDir(), `ensime_${scalaEdition}-${ensimeServerVersion}-assembly.jar`)
}

let driveRegex = "^[a-z]:"
export function getFilenameDriveUpper(document : vscode.TextDocument) : string {
    return getPathDriveUpper(document.fileName)
}

export function getPathDriveUpper(path : string) : string {

    if(path.match(driveRegex) != null)
    {
        return path.substr(0, 2).toUpperCase() + path.substr(2)
    }
    else
    {
        return path
    }
}

// TODO: get a persistant dir from package, not project
export function packageDir() {
  return path.join(vscode.workspace.rootPath, ".ensime_cache")
}