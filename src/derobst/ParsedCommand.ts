import { EditorView } from '@codemirror/view';
import { SyntaxNode, SyntaxNodeRef } from '@lezer/common/dist/tree';

// export these to our clients so they don't have to go find them
export { RangeSetBuilder } from "@codemirror/state";
export { Decoration } from "@codemirror/view";
export type { SyntaxNode } from '@lezer/common/dist/tree';
export type { EditorView } from '@codemirror/view';

export abstract class ParsedCommand {
    abstract get regex(): RegExp;

    commandNode: SyntaxNode;

    parse(text: string, commandNodeRef: SyntaxNodeRef): RegExpMatchArray | null {
        if (this.commandNode !== undefined) {
            throw new Error("must not reuse ParsedCommand object, since it carries state and is referenced by clients")
        }
        const match: RegExpMatchArray | null = text.match(this.regex);
        if (match === null) {
            return match;
        }

        // freeze to retain this node
        this.commandNode = commandNodeRef.node; 
        return match;
    }

	async handleUsed(_view: EditorView) {
        // no code
	}
}

