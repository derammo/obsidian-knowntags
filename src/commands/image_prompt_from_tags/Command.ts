import { HEADER_NODE_PREFIX, QUOTE_NODE_CONTAINING_COMMAND_PREFIX, QUOTE_NODE_PREFIX } from "src/derobst/ObsidianInternals";
import { Decoration, SyntaxNode } from "src/derobst/ParsedCommand";
import { DescriptorsCommand } from "src/main/DescriptorsCommand";

import { CommandContext } from "src/main/Plugin";
import { EditWidget } from "./EditWidget";

const COMMAND_REGEX = /^\s*!image-prompt-from-tags(?:\s(.*)|$)/;

export class Command extends DescriptorsCommand {
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
			if (scan.type.name.startsWith(HEADER_NODE_PREFIX)) {
				// gone too far
				scan = null;
				break;
			}
			if (scan.type.name.startsWith(QUOTE_NODE_PREFIX)) {
				// found what we want
				break;
			}
			if (scan.type.name.startsWith(QUOTE_NODE_CONTAINING_COMMAND_PREFIX)) {
				// found what we want, we are inside the quote
				break;
			}

			scan = scan.prevSibling;
		}
		
		if (scan === null) {
			// no quote text to work on, do nothing
			return;
		}

		const quoteText = context.view.state.doc.sliceString(scan.from, scan.to);
		const quote = scan;
		if (!quoteText.startsWith("> ")) {
			// don't work on stuff that has been disturbed too much
			return;
		}

		let descriptors = this.createDescriptorsCollection();

		// gather from Description section
		this.gatherDescriptionSection(descriptors, context);

		// XXX gather from tags

		const text = new EditWidget(context.plugin, this, quote, descriptors);
		context.builder.add(quote.from, quote.to, Decoration.widget({ widget: text }));
		context.markWithBehaviorClasses(this);
	}
}


