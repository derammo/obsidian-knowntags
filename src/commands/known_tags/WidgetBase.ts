import { CommandWidgetBase, EditorView, ParsedCommand, SyntaxNode } from "derobst/command";
import { Host } from "main/Plugin";

export abstract class WidgetBase extends CommandWidgetBase<Host> {
	tagNode: SyntaxNode;

	constructor(host: Host, tagNode: SyntaxNode, command: ParsedCommand<Host>) {
		super(host, command);
		this.tagNode = tagNode;
	}

	getTag(view: EditorView): string {
		return view.state.doc.sliceString(this.tagNode.from, this.tagNode.to);
	}

	async replaceTag(view: EditorView, value: string) {
		view.dispatch({ 
			changes: { from: this.tagNode.from, to: this.tagNode.to, insert: value }
		});
	}

	styleToMatchTags(control: HTMLElement) {
		control.className = "cm-s-obsidian cm-formatting cm-formatting-hashtag cm-hashtag cm-hashtag-begin cm-hashtag-end";
		control.style.height = "auto";
		control.style.width = "auto";
		control.style.paddingTop = "0em";
		control.style.paddingBottom = "0em";
		control.style.marginRight = "0.25em";
		control.style.color = "var(--text-normal)";
	}
}
