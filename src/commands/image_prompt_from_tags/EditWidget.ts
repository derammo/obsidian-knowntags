import { CommandWidget } from "src/derobst/CommandWidget";
import { EditorView, ParsedCommand, SyntaxNode } from "src/derobst/ParsedCommand";
import { Host } from "src/main/Plugin";

import { ALT_TEXT_PREFIX } from "./Command";

export class EditWidget extends CommandWidget<Host> {
	generated: string;
	previousValue: string | undefined;
	currentValue: string = "";

	constructor(
		host: Host, 
		command: ParsedCommand, 
		public quoteStart: SyntaxNode, 
		public quoteEnd: SyntaxNode,
		public descriptors: Set<string>) {
		super(host, command);
	}

	toDOM(view: EditorView): HTMLElement {
		const line = document.createElement("div");
		line.style.width = "100%";
		line.style.marginTop = "-24px";
		line.style.marginBottom = "-24px";
		// line.style.marginTop = "calc(0px - var(--line-height-normal) )";
		// line.style.marginBottom = "calc(0px - var(--line-height-normal))";
		line.style.width = "100%";
		line.style.display = "flex";
		line.appendChild(this.buildTextEdit(view));
		line.appendChild(this.buildButton(view));

		return line;
	}

	buildTextEdit(view: EditorView): HTMLElement {
		const promptParts: string[] = Array.from(this.descriptors);
		promptParts.push("portrait");
		promptParts.push("colored pencil");
		promptParts.push("realistic");
		promptParts.push("white background");
		this.generated = promptParts.join(", ");

		const control = document.createElement("textarea");
		
		// XXX remove
		// this.debugEventsBrutally(control);

		control.style.flexGrow = "1";
		control.style.height = "6em";

		control.placeholder = this.generated;
		this.loadContent(view, control);

		control.addEventListener('change', async (event: Event) => {
			// console.log("test input");
			let input: string = ((event.target as any)?.value ?? "").trim();

			// if set back to default, store nothing
			if (input == this.generated) {
				input = "";
			}

			// console.log(`writing '${input}'`)
			this.previousValue = undefined;
			this.currentValue = input;
			await this.replaceQuote(view, input);
		});
		control.addEventListener('focusin', async (event: Event) => {
			console.log("focusin");
			this.previousValue = control.value;
			if (control.value.length < 1) {
				console.log(`loading generated '${this.generated}'`);
				control.value = this.generated;
			}
		});
		control.addEventListener('focusout', async (event: Event) => {
			console.log("focusout");
			if (this.previousValue !== undefined) {
				console.log(`restoring '${this.previousValue}'`);
				control.value = this.previousValue;
				this.previousValue = undefined;
			}
		});
		return control;
	}

	// XXX on download, use meta-png or similar library to add prompt used as metadata to the PNG

	buildButton(view: EditorView): HTMLElement {
		const control = document.createElement("button");
		const prompt = (this.currentValue.length > 0)? this.currentValue: this.generated;
		
		control.innerText = "AI draw";
		control.style.marginLeft = "0.5em";

		control.addEventListener('click', async (event: Event) => {
			this.host.generateImages(prompt)
			.then((results: { generationId: string, urls: string[] }) => {
				// XXX config
				const presentSize = 256;
				const chunks: string[] = [ "\n\n" ];
				results.urls.forEach((url, imageIndex) => {
					chunks.push(`${imageIndex > 0?" ":""}![${ALT_TEXT_PREFIX}${results.generationId} ${prompt} ${imageIndex + 1}|${presentSize}](${url})`);
				});

				view.dispatch({
					changes: { from: this.command.commandNode.to, to: this.command.commandNode.to, insert: chunks.join("") }
				});

				// XXX optionally, create an obsidian vault file /DALL-E/${generationId}.md containing the prompt info and links to the images
				this.command.handleUsed(view);			
			});
		});
		return control;
	}

	private loadContent(view: EditorView, control: HTMLTextAreaElement) {
		const content = view.state.doc.sliceString(this.quoteStart.from + 2, this.quoteEnd.to);
		if (content.length > 0) {
			console.log("content loaded");
			this.currentValue = content;
			control.value = content;
		}
	}

	async replaceQuote(view: EditorView, value: string) {
		view.dispatch({ 
			changes: { from: this.quoteStart.from + 2, to: this.quoteEnd.to, insert: value }
		});
	}
}
