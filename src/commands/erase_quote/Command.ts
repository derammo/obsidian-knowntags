import { HEADER_NODE_PREFIX, QUOTE_NODE_PREFIX } from "src/derobst/ObsidianInternals";
import { Decoration, SyntaxNode } from "src/derobst/ParsedCommand";
import { ParsedCommandWithSettings } from "src/derobst/ParsedCommandWithSettings";

import { CommandContext } from "src/main/Plugin";
import { ButtonWidget } from "./ButtonWidget";

const COMMAND_REGEX = /^\s*!erase-quote(?:\s(.*)|$)/;

export class Command extends ParsedCommandWithSettings {
	get regex(): RegExp {
		return COMMAND_REGEX;
	}

	static match(text: string): boolean {
		return text.match(COMMAND_REGEX) !== null;
	}

	buildWidget(context: CommandContext): void {
		// console.log("BUILDER building erase-quote")
		let scan: SyntaxNode | null = this.commandNode;
		
		while (scan !== null) {
			// console.log(`BUILDER ${scan.type.name} '${context.view.state.doc.sliceString(scan.from, scan.to)}'`)
			if (scan.type.name.startsWith(HEADER_NODE_PREFIX)) {
				// gone too far
				scan = null;
				break;
			}
			if (scan.type.name.startsWith(QUOTE_NODE_PREFIX)) {
				// found what we want
				break;
			}
			if (scan.type.name.startsWith("formatting_formatting-quote")) {
				// found what we want, we are inside the quote
				break;
			}
			scan = scan.prevSibling;
		}
		
		if (scan === null) {
			// no quote text to work on, do nothing
			return;
		}

		const text = new ButtonWidget(context.plugin, this, scan);
		context.builder.add(this.commandNode.from-1, this.commandNode.from-1, Decoration.widget({ widget: text }));
		context.markWithBehaviorClasses(this);
	}
}


