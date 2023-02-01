import { EditorView } from "@codemirror/view";
import { SyntaxNode } from '@lezer/common/dist/tree';
import { KnownTagsHost } from "KnownTagsHost";
import { ParsedCommand } from "ParsedCommand";
import { KnownTagsWidget } from './KnownTagsWidget';

export class TagEditWidget extends KnownTagsWidget {
	constructor(host: KnownTagsHost, tagNode: SyntaxNode, command: ParsedCommand) {
		super(host, tagNode, command);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		const topLevel = this.host.cache.getTopLevel(this.getTag(view));
		if (topLevel !== undefined) {
			console.log(`generating edit control for top-level tag '${topLevel}'`);
			span.appendChild(this.createControl(view));
		}
		return span;
	}

	// XXX remove
	ignoreEvent(event: Event): boolean {
		console.log(`EVENT ignore ${event.type}?`);
		switch (event.type) {
			case "XXXkeydown":
				return false;
			case "XXXbeforeinput":
				return false;
			default:
				return super.ignoreEvent(event);
		}
	}

	// XXX remove
	private debugEventsBrutally(control: HTMLInputElement) {
		Object.keys((control as any).__proto__.__proto__).forEach((key: string) => {
			console.log(`considering ${key}`);
			if (key.startsWith("on")) {
				control.addEventListener(key.slice(2), this.debugEventLogger);
			}
		});
	}

	// XXX remove
	private debugEventLogger(event: Event) {
		if (event.type.startsWith('mousemove')) {
			return;
		}
		if (event.type.startsWith('pointerraw')) {
			return;
		}
		if (event.type.startsWith('pointermove')) {
			return;
		}
		console.log(`EVENT ${event.type}`);
	}
	
	createControl(view: EditorView): HTMLElement {
		const control = document.createElement("input");
		control.type = "text";
		this.styleToMatchTags(control);
		control.addEventListener('change', async (event: Event) => {
			console.log("test input");
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
