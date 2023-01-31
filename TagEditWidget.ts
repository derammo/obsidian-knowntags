import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { SyntaxNode } from '@lezer/common/dist/tree';
import { KnownTagsCache } from './KnownTagsCache';
import { KnownTagsWidget } from './KnownTagsWidget';

export class TagEditWidget extends KnownTagsWidget {
	constructor(cache: KnownTagsCache, editorState: EditorState, tagNode: SyntaxNode) {
		super(cache, editorState, tagNode);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		console.log(`checking tag '${this.tag}'`);
		const topLevel = this.cache.getTopLevel(this.tag);
		if (topLevel !== undefined) {
			console.log(`generating edit control for top-level tag '${topLevel}'`);
			span.appendChild(this.createControl(view));
		}
		return span;
	}

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

	createControl(view: EditorView): HTMLElement {
		const control = document.createElement("input");
		control.type = "text";
		this.styleToMatchTags(control);
		control.addEventListener('change', async (event: Event) => {
			console.log("test input");
			const input: string = ((event.target as any)?.value ?? "").trim();
			const topLevel = this.cache.getTopLevel(this.tag);
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
			this.replaceTag(view, input);
		});
		return control;
	}

	private debugEventsBrutally(control: HTMLInputElement) {
		Object.keys((control as any).__proto__.__proto__).forEach((key: string) => {
			console.log(`considering ${key}`);
			if (key.startsWith("on")) {
				control.addEventListener(key.slice(2), this.debugEventLogger);
			}
		});
	}

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
}
