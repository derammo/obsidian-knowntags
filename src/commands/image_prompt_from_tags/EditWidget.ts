import { CommandWidget } from "src/derobst/CommandWidget";
import { EditorView, ParsedCommand, SyntaxNode } from "src/derobst/ParsedCommand";
import { Host } from "src/main/Plugin";

export class EditWidget extends CommandWidget<Host> {
	quote: SyntaxNode;
	generated: string;
	previousValue: string | undefined;

	constructor(host: Host, command: ParsedCommand, quote: SyntaxNode) {
		super(host, command);
		this.quote = quote;
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
		// XXX HACK prototype
		this.generated = "baker, male, human, friendly,  middle aged, portrait, colored pencil, realistic, white background";

		const control = document.createElement("input");
		
		// XXX remove
		// this.debugEventsBrutally(control);

		control.type = "text";
		control.style.flexGrow = "1";

		control.placeholder = this.generated;
		this.loadContent(view, control);

		control.addEventListener('change', async (event: Event) => {
			// console.log("test input");
			let input: string = ((event.target as any)?.value ?? "").trim();

			// if set back to default, store nothing
			if (input == this.generated) {
				input = "";
			}

			this.previousValue = undefined;
			console.log(`writing '${input}'`)
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

	buildButton(view: EditorView): HTMLElement {
		const control = document.createElement("button");
		control.innerText = "generate";
		control.addEventListener('click', async (event: Event) => {
			await this.command.handleUsed(view);
		});
		return control;
	}

	private loadContent(view: EditorView, control: HTMLInputElement) {
		const content = view.state.doc.sliceString(this.quote.from + 2, this.quote.to);
		if (content.length > 0) {
			console.log("content loaded");
			control.value = content;
		}
	}

	async replaceQuote(view: EditorView, value: string) {
		view.dispatch({ 
			changes: { from: this.quote.from + 2, to: this.quote.to, insert: value }
		});
	}
}
