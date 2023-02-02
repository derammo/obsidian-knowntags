import { EditorView } from '@codemirror/view';
import { SyntaxNodeRef } from '@lezer/common/dist/tree';
import { ParsedCommand } from './ParsedCommand';

// export these to our clients so they don't have to go find them
export { RangeSetBuilder } from "@codemirror/state";
export { Decoration } from "@codemirror/view";
export type { SyntaxNode } from '@lezer/common/dist/tree';
export type { EditorView } from '@codemirror/view';

export abstract class ParsedCommandWithSettings extends ParsedCommand {
    settings: { [key: string]: boolean | string; } = {};

    async handleUsed(view: EditorView) {
        super.handleUsed(view);
        if (this.settings.remove && this.commandNode !== undefined) {
            view.dispatch({
                changes: { from: this.commandNode.from - 1, to: this.commandNode.to + 1 }
            });
        }
    }

    parse(text: string, commandNodeRef: SyntaxNodeRef): RegExpMatchArray | null {
        const match = super.parse(text, commandNodeRef);
        if (match === null) {
            return match;
        }
        if (match[1] !== undefined) {
            match[1].split(/\s+/).forEach((setting: string) => {
                const equals = setting.indexOf("=");
                if (equals == 0) {
                    // discard any work we did
                    // XXX log parse error
                    this.settings = {};
                    return null;
                }
                if (equals > 0) {
                    this.settings[setting.slice(0, equals)] = setting.slice(equals + 1);
                } else {
                    this.settings[setting] = true;
                }
            });
        }
        return match;
    }
}
