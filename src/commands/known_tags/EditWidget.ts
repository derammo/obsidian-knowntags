import { EditorView, ParsedCommand, SyntaxNode } from "src/derobst/ParsedCommand";
import { Host } from "src/main/Plugin";
import { WidgetBase } from './WidgetBase';

export class EditWidget extends WidgetBase {
	constructor(host: Host, tagNode: SyntaxNode, command: ParsedCommand) {
		super(host, tagNode, command);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		const topLevel = this.host.cache.getTopLevel(this.getTag(view));
		if (topLevel !== undefined) {
			// console.log(`generating edit control for top-level tag '${topLevel}'`);
			span.appendChild(this.createControl(view));
		}
		return span;
	}
	
	createControl(view: EditorView): HTMLElement {
		const control = document.createElement("input");
		control.type = "text";
		this.styleToMatchTags(control);
		control.addEventListener('change', async (event: Event) => {
			// console.log("test input");
			const input: string = ((event.target as any)?.value ?? "").trim();
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
		return control;
	}
}