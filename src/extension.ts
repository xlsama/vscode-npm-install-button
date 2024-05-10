import {
  languages,
  ExtensionContext,
  CodeLensProvider,
  TextDocument,
  CodeLens,
  Range,
  commands,
  window,
  StatusBarAlignment,
} from 'vscode'
import { spawn } from 'child_process'
import path from 'path'

class PackageJsonCodeLensProvider implements CodeLensProvider {
  async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
    const text = document.getText()
    let range: Range

    const dependenciesTypes = [
      '"dependencies"',
      '"devDependencies"',
      '"peerDependencies"',
    ]

    for (const depType of dependenciesTypes) {
      const index = text.indexOf(depType)
      if (index !== -1) {
        const position = document.positionAt(index)
        range = new Range(position, position)
        break
      }
    }

    // @ts-expect-error
    if (!range) {
      return []
    }

    const codeLens = new CodeLens(range, {
      command: 'vscode-npm-install-button.install',
      title: '$(sync) Intall',
    })

    return [codeLens]
  }
}

function install() {
  let statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 0)

  statusBarItem.text = '$(sync~spin) Installing...'
  statusBarItem.show()

  let child = spawn('ni', {
    shell: true,
    cwd: path.dirname(window.activeTextEditor!.document.uri.fsPath),
  })

  child.stdout.on('data', data => {
    console.log(`stdout: ${data.toString()}`)
  })
  child.stderr.on('data', data => {
    let error = `stderr: ${data.toString()}`
    console.error(error)
    window.showErrorMessage(error)
  })

  child.on('close', code => {
    console.log(`child process exited with code ${code}`)
    statusBarItem.dispose()
  })
}

export function activate(context: ExtensionContext) {
  const disposables = []

  disposables.push(
    commands.registerCommand('vscode-npm-install-button.install', install),
  )

  disposables.push(
    languages.registerCodeLensProvider(
      { pattern: '**/package.json' },
      new PackageJsonCodeLensProvider(),
    ),
  )

  context.subscriptions.push(...disposables)
}
