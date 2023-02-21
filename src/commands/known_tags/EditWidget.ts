import { CommandContext, EditorView, ParsedCommand, SyntaxNode } from "derobst/command";
import { Host } from "main/Plugin";
import { WidgetBase } from './WidgetBase';

export class EditWidget extends WidgetBase {
	constructor(context: CommandContext<Host>, tagNode: SyntaxNode, command: ParsedCommand<Host>) {
		super(context, tagNode, command);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		span.classList.add("derammo-edit-container");
		const topLevel = this.host.cache.getTopLevel(this.getTag(view));
		if (topLevel !== undefined) {
			span.appendChild(this.createControl(view));
		}
		return span;
	}
	
	createControl(view: EditorView): HTMLElement {
		const control = document.createElement("input");
		control.classList.add("derammo-edit-control");
		control.type = "text";
		this.host.registerDomEvent(control, "change", async (event: Event) => {
			const input: string = ((event.target as HTMLInputElement)?.value ?? "").trim();
			const topLevel = this.host.cache.getTopLevel(this.getTag(view));
			if (input.length < 1) {
				return;
			}
			if (topLevel !== undefined) {
				if (!input.startsWith(`${topLevel}/`)) {
					// interpret input as just subtag path
					this.replaceTag(view, `${topLevel}/${input}`);
					return;
				}
			}
			// edit back to front to keep syntax tree coordinates valid
			await this.command.handleUsed(view);
			await this.replaceTag(view, input);
		});
		this.host.registerDomContextMenuTarget(control, this.command);
		return control;
	}
}
