import { CommandContext, CommandWidgetBase, EditorView, ParsedCommand, SyntaxNodeRef } from "derobst/command";
import { UpdatedTextRange } from "derobst/view";
import { Host } from "main/Plugin";

export abstract class WidgetBase extends CommandWidgetBase<Host> {
	protected readonly tagRange: UpdatedTextRange;

	constructor(context: CommandContext<Host>, tagNode: SyntaxNodeRef, command: ParsedCommand<Host>) {
		super(context, command);
		this.tagRange = context.plugin.tracking.register(context.state, tagNode);
	}

	getTag(view: EditorView): string {
		const tagRange = this.tagRange.fetchCurrentRange();
		if (tagRange === null) {
			return "";
		}
		return view.state.doc.sliceString(tagRange.from, tagRange.to);
	}

	async replaceTag(view: EditorView, value: string) {
		const tagRange = this.tagRange.fetchCurrentRange();
		if (tagRange === null) {
			return;
		}
		view.dispatch({ 
			changes: { from: tagRange.from, to: tagRange.to, insert: value }
		});
	}

	styleToMatchTags(control: HTMLElement) {
		control.className = "cm-s-obsidian cm-formatting cm-formatting-hashtag cm-hashtag cm-hashtag-begin cm-hashtag-end derammo-match-tags";
	}
}
