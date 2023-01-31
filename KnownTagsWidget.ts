import { EditorState } from "@codemirror/state";
import { EditorView, WidgetType } from "@codemirror/view";
import { SyntaxNode } from '@lezer/common/dist/tree';
import { KnownTagsCache } from './KnownTagsCache';

export abstract class KnownTagsWidget extends WidgetType {
	cache: KnownTagsCache;
	tagNode: SyntaxNode;
	tag: string;

	constructor(cache: KnownTagsCache, editorState: EditorState, tagNode: SyntaxNode) {
		super();
		this.cache = cache;
		this.tagNode = tagNode;
		this.tag = editorState.doc.sliceString(tagNode.from, tagNode.to);
	}

	async replaceTag(view: EditorView, value: string) {
		view.dispatch({ 
			changes: { from: this.tagNode.from, to: this.tagNode.to, insert: value }
		});
	}

	styleToMatchTags(button: HTMLElement) {
		button.className = "cm-s-obsidian cm-formatting cm-formatting-hashtag cm-hashtag cm-hashtag-begin cm-hashtag-end";
		button.style.height = "auto";
		button.style.width = "auto";
		button.style.paddingTop = "0em";
		button.style.paddingBottom = "0em";
		button.style.marginRight = "0.25em";
		button.style.color = "var(--text-normal)";
	}
}
