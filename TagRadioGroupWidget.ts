import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { SyntaxNode } from '@lezer/common/dist/tree';
import { KnownTagsCache } from './KnownTagsCache';
import { KnownTagsWidget } from './KnownTagsWidget';

export class TagRadioGroupWidget extends KnownTagsWidget {
	constructor(cache: KnownTagsCache, editorState: EditorState, tagNode: SyntaxNode) {
		super(cache, editorState, tagNode);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		console.log(`checking tag '${this.tag}'`);
		const topLevel = this.cache.getTopLevel(this.tag);
		if (topLevel !== undefined) {
			console.log(`generating buttons for top-level tag '${topLevel}'`);
			this.cache.getChoices(topLevel).forEach((subpath: string) => {
				console.log(`generating button for tag '${topLevel}/${subpath}'`);
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
			console.log("test click");
			await this.replaceTag(view, value);
		});
		return button;
	}
}
