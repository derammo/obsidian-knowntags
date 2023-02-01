import { EditorView, WidgetType } from "@codemirror/view";
import { SyntaxNode } from '@lezer/common/dist/tree';
import { ParsedCommand } from "ParsedCommand";
import { KnownTagsCache } from './KnownTagsCache';

export abstract class KnownTagsWidget extends WidgetType {
	cache: KnownTagsCache;
	tagNode: SyntaxNode;
	command: ParsedCommand;

	constructor(cache: KnownTagsCache, tagNode: SyntaxNode, command: ParsedCommand) {
		super();
		this.cache = cache;
		this.tagNode = tagNode;
		this.command = command;
	}

	getTag(view: EditorView): string {
		return view.state.doc.sliceString(this.tagNode.from, this.tagNode.to);
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