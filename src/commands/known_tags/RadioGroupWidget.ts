import { CommandContext, EditorView, ParsedCommand, SyntaxNodeRef } from "derobst/command";
import { Host } from "main/Plugin";
import { WidgetBase } from './WidgetBase';

export class RadioGroupWidget extends WidgetBase {
	constructor(context: CommandContext<Host>, tagNode: SyntaxNodeRef, command: ParsedCommand<Host>) {
		super(context, tagNode, command);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		span.classList.add("derammo-radiogroup-container");
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
		this.styleToMatchTags(button);
		button.classList.add("derammo-radiogroup-button", "derammo-button");
		button.innerText = label;
		this.host.registerDomEvent(button, "click", async () => {
			// edit back to front to keep syntax tree coordinates valid
			await this.command.handleUsed(view);
			await this.replaceTag(view, value);
		});
		this.host.registerDomContextMenuTarget(button, this.command);
		return button;
	}
}
