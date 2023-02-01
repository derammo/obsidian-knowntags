import { EditorView } from '@codemirror/view';
import { SyntaxNode, SyntaxNodeRef } from '@lezer/common/dist/tree';

export abstract class ParsedCommand {
    abstract get regex(): RegExp;
    
    commandNode: SyntaxNode;
	settings: { [key: string]: boolean | string } = {};

    parse(text: string, commandNodeRef: SyntaxNodeRef): boolean {
        if (this.commandNode !== undefined) {
            throw new Error("must not reuse ParsedCommand object, since it carries state and is referenced by clients")
        }
        const match: RegExpMatchArray | null = text.match(this.regex);
        if (match === null) {
            return false;
        }

        if (match[1] !== undefined) {
            match[1].split(/\s+/).forEach((setting: string) => {
                const equals = setting.indexOf("=");
                if (equals == 0) {
                    // discard any work we did
                    this.settings = {};
                    return false;
                }
                if (equals > 0) {
                    this.settings[setting.slice(0, equals)] = setting.slice(equals+1);    
                } else {
                    this.settings[setting] = true;
                }
            });
        }
        // freeze to retain this node
        this.commandNode = commandNodeRef.node; 
        return true;
    }

	async handleUsed(view: EditorView) {
        if (this.settings.remove && this.commandNode !== undefined) {
            view.dispatch({ 
                changes: { from: this.commandNode.from-1, to: this.commandNode.to+1 }
            });
        }
	}
}
