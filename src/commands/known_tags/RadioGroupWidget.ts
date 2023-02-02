import { EditorView, ParsedCommand, SyntaxNode } from "src/derobst/ParsedCommand";
import { Host } from "src/main/Plugin";
import { WidgetBase } from './WidgetBase';

export class RadioGroupWidget extends WidgetBase {
	constructor(host: Host, tagNode: SyntaxNode, command: ParsedCommand) {
		super(host, tagNode, command);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		const topLevel = this.host.cache.getTopLevel(this.getTag(view));
		if (topLevel !== undefined) {
			// console.log(`generating buttons for top-level tag '${topLevel}'`);
			this.host.cache.getChoices(topLevel).forEach((subpath: string) => {
				// console.log(`generating button for tag '${topLevel}/${subpath}'`);
				span.appendChild(this.createButton(view, subpath, `${topLevel}/${subpath}`));
			});
		}
		return span;
	}

	createButton(view: EditorView, label: string, value: string): HTMLElement {
		const button = document.createElement("button");
		button.innerText = label;
		this.styleToMatchTags(button);
		button.on("click", "button", async () => {
			// console.log("test click");
			// edit back to front to keep syntax tree coordinates valid
			await this.command.handleUsed(view);
			await this.replaceTag(view, value);
		});
		return button;
	}
}
