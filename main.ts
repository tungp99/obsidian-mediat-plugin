import { writeFile } from "fs"
import { resolve } from "path"
import { App, MarkdownView, Modal, Plugin, Setting } from "obsidian"

export default class MyPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "mediat-attach-audio-from-link",
      name: "Attach Audio from Link",
      checkCallback: (checking: boolean) => {
        const markdownView =
          this.app.workspace.getActiveViewOfType(MarkdownView)
        if (markdownView) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if (!checking) {
            new SampleModal(this.app).open()
          }

          // This command will only show up in Command Palette when the check function returns true
          return true
        }
      },
    })
  }
}

class SampleModal extends Modal {
  constructor(app: App) {
    super(app)

    this.app = app

    let link = ""
    new Setting(this.contentEl)
      .setName("Media Link")
      .addText(text => text.onChange(value => (link = value)))

    new Setting(this.contentEl).addButton(btn =>
      btn
        .setButtonText("OK")
        .setCta()
        .onClick(() => {
          this.onSubmit(link)
          this.close()
          link = ""
          this.contentEl.setText("")
        })
    )
  }

  async onSubmit(dwnlUrl: string) {
    const out = dwnlUrl.split("/").pop()
    if (!out) {
      Promise.reject("could not download, debug here") // #TODO
      return
    }

    //@ts-ignore
    const basePath = this.app.vault.adapter.basePath
    const attachmentPath =
      await this.app.fileManager.getAvailablePathForAttachment(out)

    const outPath = resolve(basePath, attachmentPath)

    const res = await fetch(dwnlUrl)
    if (!res.ok) {
      Promise.reject("could not download, debug here") // #TODO
      return
    }

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    writeFile(outPath, buffer, err => {
      if (err) {
        Promise.reject(err)
        return
      }
    })

    const editor = this.app.workspace.activeEditor?.editor
    if (!editor) {
      // Promise.reject("could not download, debug here") // #TODO
      return
    }
    editor.replaceRange(`![[${attachmentPath}]]\n`, editor.getCursor())
  }
}
