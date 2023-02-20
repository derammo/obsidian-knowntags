import { EditorView, ParsedCommand, SyntaxNode } from "derobst/command";
import { Host } from "main/Plugin";
import { WidgetBase } from './WidgetBase';

export class RadioGroupWidget extends WidgetBase {
	constructor(host: Host, tagNode: SyntaxNode, command: ParsedCommand<Host>) {
		super(host, tagNode, command);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		const topLevel = this.host.cache.getTopLevel(this.getTag(view));
		if (topLevel !== null) {
			this.host.cache.getChoices(topLevel).forEach((subpath: string) => {
				span.appendChild(this.createButton(view, subpath, `${topLevel}/${subpath}`));
			});
		}
		return span;
	}

	createButton(view: EditorView, label: string, value: string): HTMLElement {
		const button = document.createElement("button");
		button.innerText = label;
		this.styleToMatchTags(button);
		this.host.registerDomEvent(button, "click", async () => {
			// edit back to front to keep syntax tree coordinates valid
			await this.command.handleUsed(view);
			await this.replaceTag(view, value);
		});
		this.host.registerDomContextMenuTarget(button, this.command);
		return button;
	}
}
