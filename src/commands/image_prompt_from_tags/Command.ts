import { Decoration, SyntaxNode } from "src/derobst/ParsedCommand";
import { ParsedCommandWithSettings } from "src/derobst/ParsedCommandWithSettings";

import { CommandContext } from "src/main/Plugin";
import { EditWidget } from "./EditWidget";

const COMMAND_REGEX = /^\s*!image-prompt-from-tags(?:\s(.*)|$)/;

export class Command extends ParsedCommandWithSettings {
	get regex(): RegExp {
		return COMMAND_REGEX;
	}

	static match(text: string): boolean {
		return text.match(COMMAND_REGEX) !== null;
	}

	buildWidget(context: CommandContext): void {
		let scan: SyntaxNode | null = this.commandNode;
		while (scan !== null) {
			console.log(`${scan.type.name} '${context.view.state.doc.sliceString(scan.from, scan.to)}'`)
			if (scan.type.name.startsWith("HyperMD-header")) {
				// gone too far
				scan = null;
				break;
			}
			if (scan.type.name.startsWith("HyperMD-quote")) {
				// found what we want
				break;
			}
			scan = scan.prevSibling;
		}
		
		if (scan === null) {
			// no quote text to work on, do nothing
			return;
		}
		const quote = context.view.state.doc.sliceString(scan.from, scan.to);
		if (!quote.startsWith("> ")) {
			// don't work on stuff that has been disturbed too much
			return;
		}
		const text = new EditWidget(context.plugin, this, scan);
		context.builder.add(scan.from, scan.to, Decoration.widget({ widget: text }));
		context.markWithBehaviorClasses(this);
	}
}


