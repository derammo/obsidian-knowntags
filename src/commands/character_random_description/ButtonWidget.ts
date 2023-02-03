import { CommandWidget } from "src/derobst/CommandWidget";
import { EditorView, ParsedCommand, SyntaxNode } from "src/derobst/ParsedCommand";
import { Host } from "src/main/Plugin";

import { Configuration, CreateCompletionResponseChoicesInner, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: "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" // process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export class ButtonWidget extends CommandWidget<Host> {
	generated: string;
	previousValue: string | undefined;

	constructor(host: Host, command: ParsedCommand, public descriptors: Set<string>) {
		super(host, command);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		span.appendChild(this.buildButton(view));
		return span;
	}

	buildButton(view: EditorView): HTMLElement {
		const control = document.createElement("button");
		control.innerText = "describe";
		control.addEventListener('click', async (event: Event) => {
			let active: Promise<void>[] = [];
			
			active.push(this.queryDavinci3(view));

			// XXX remove
			// active = active.concat(this.generateTests(this.prompt));

			Promise.all(active)
			.then(() => {
				this.command.handleUsed(view);
			});
		});
		return control;
	}

	private async queryDavinci3(view: EditorView) {
		// XXX configure number to generate
		// XXX configure max number of unique ones to offer up
		const generate_number = 16;
		const return_number = 8;
		const promptParts: string[] = Array.from(this.descriptors);
		promptParts.push("using 2 words for each attribute");

		const prompt: string = `list ${generate_number} physical attributes or articles of clothing of an atypical baker, friendly, elven, female, rich, ${promptParts.join(",")}`;
		console.log(`PROMPT '${prompt}'`);

		return openai.createCompletion({
			model: "text-davinci-003",
			prompt: prompt,
			// XXX config
			temperature: 0.9,
			max_tokens: 100,
			presence_penalty: 1
		})
		.then((response) => {
			let lines: string[] = [];
			response.data.choices.forEach((value: CreateCompletionResponseChoicesInner) => {
				if (value.text === undefined) {
					return;
				}
				
				value.text.split(/[\n,.;:]/g).forEach((line: string) => {
					let text = line.trim();
					if (text.length < 1) {
						return;
					}
					const match = text.match(/^\s*[1-9][0-9]*\.\s(.*)$/);
					if (match !== null) {
						text = match[1];
					}
					if (text.length < 1) {
						return;
					}
					text = text.toLowerCase();
					if (this.descriptors.has(text)) {
						// don't allow duplicates
						return;
					} 
					lines.push(`> ${text} \`!erase-quote\``);
					console.log(`GENERATE '${text}'`);
				})
			})

			if (lines.length < 1) {
				console.log("GENERATE no new descriptions generated");
				return;
			}

			// randomly reduce down to the requested amount
			while (lines.length > return_number) {
				lines.splice(Math.floor(Math.random() * lines.length), 1);
			}

			const generated = `${lines.join("\n")}\n\n`;
			view.dispatch({ 
				changes: { 
					from: this.command.commandNode.from-1, 
					to: this.command.commandNode.from-1, 
					insert: generated }
			});			
		});
	}

	private generateTests(prompt: string): Promise<void>[] {
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
		return active;
	}
}
