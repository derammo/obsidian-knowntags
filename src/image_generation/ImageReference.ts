import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { SyntaxNode } from "@lezer/common";
import { Host } from "src/main/Plugin";

import * as got from "got";
import { fileTypeFromBuffer, FileTypeResult } from "file-type";
import { TFile } from "obsidian";
import { syntaxTree } from "@codemirror/language";

export class ImageReference {
  from: number;
  to: number;
  url: string;

  constructor(
    state: EditorState,
    public readonly generationId: string,
    altText: SyntaxNode,
    url: SyntaxNode,
    closeParen: SyntaxNode
  ) {
    this.from = altText.from - 2;
    this.to = closeParen.to;
    if (state.doc.sliceString(closeParen.to, closeParen.to+1) == " ") {
      this.to++;
    }
    this.url = state.doc.sliceString(url.from, url.to);
  }

  erase(view: EditorView) {
    view.dispatch({
      changes: {
        from: this.from,
        to: this.to
      }
    });
  }

  insertReference(view: EditorView, url: string) {
    view.dispatch({
      changes: {
        from: this.from,
        to: this.from,
        insert: `![chosen image](${url})`
      }
    });
  }

  downloadRemoteImage(host: Host, view: EditorView) {
    const imageReference = this;
    const url = new URL(this.url);
    
    got.got(url, { responseType: "buffer" })
      .then((response: got.Response<Buffer>) => {
        return response.body;
      })
      .then((buffer: Buffer) => {
        return fileTypeFromBuffer(buffer)
          .then((fileType: FileTypeResult) => {
            return { buffer, fileType };
          });
      })
      .then((results: { buffer: Buffer; fileType: FileTypeResult; }) => {
        if (results.fileType.ext !== "png") {
          throw new Error("Unknown file type");
        }
        const fileName = url.pathname.split('/').last()!;
        // XXX config
        // XXX also create markdown file with original meta information such as prompt and all components of the URL other than authorization ones
        return host.createFileFromBuffer(`DALL-E/${fileName}`, results.buffer);
      })
      .then((file: TFile) => {
        // rescane the current document version to find any URL occurrences that are still there
        const urls: SyntaxNode[] = [];
        syntaxTree(view.state).iterate({
          enter(scannedNode) {
            switch (scannedNode.type.name) {
              case 'string_url':
                if (view.state.doc.sliceString(scannedNode.from, scannedNode.to) === imageReference.url) {
                  urls.push(scannedNode.node);
                }
                break;
            }
          }
        });
        // replace all image references, in reverse order
        urls.reduceRight((_, url: SyntaxNode) => {
          view.dispatch({ changes: { from: url.from, to: url.to, insert: file.path } });
        }, null);
      });
  }
}
