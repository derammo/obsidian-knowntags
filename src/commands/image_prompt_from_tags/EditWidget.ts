import { CommandWidget } from "src/derobst/CommandWidget";
import { EditorView, ParsedCommand, SyntaxNode } from "src/derobst/ParsedCommand";
import { Host } from "src/main/Plugin";

import { Configuration, CreateCompletionResponseChoicesInner, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: "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" // process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export class EditWidget extends CommandWidget<Host> {
	generated: string;
	previousValue: string | undefined;

	constructor(host: Host, command: ParsedCommand, public quote: SyntaxNode, public descriptors: Set<string>) {
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
		this.generated = promptParts.join(",");

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
		const prompt = "list 4 physical attributes or articles of clothing of a friendly elven baker, using 2 words for each attribute";
		// const prompt = "attribute: friendly\nattribute: elven\nattribute: baker\nattribute: ";
		
		control.innerText = "generate";
		control.addEventListener('click', async (event: Event) => {
			let active: Promise<void>[] = [];
		 	[ "text-ada-001", "text-babbage-001", "text-curie-001", "text-davinci-003" ].forEach((model: string) => {
				active.push(openai.createCompletion({
					model: model,
					prompt: prompt,
					temperature: 0.9,
					max_tokens: 100,
					presence_penalty: 1
				})
				.then((response) => {
					console.log(model);
					response.data.choices.forEach((value: CreateCompletionResponseChoicesInner) => {
						console.log(value.text);
					})
					console.log(openai);
				}));
			})
			Promise.all(active)
			.then(() => {
				this.command.handleUsed(view);
			})
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
