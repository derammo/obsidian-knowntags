import { Decoration, ParsedCommandWithParameters, SyntaxNode, SyntaxNodeRef } from "derobst/command";
import { HEADER_NODE_PREFIX, QUOTE_NODE_CONTAINING_COMMAND_PREFIX, QUOTE_NODE_PREFIX } from "derobst/internals";
import { ViewPluginContext } from "derobst/view";
import { Host } from "main/Plugin";
import { WidgetFormatter } from "main/WidgetFormatter";

import { ButtonWidget } from "./ButtonWidget";

const COMMAND_REGEX = /^\s*!erase-quote(?:\s(.*)|$)/;

export class Command extends ParsedCommandWithParameters<Host> {
	get regex(): RegExp {
		return COMMAND_REGEX;
	}

	static match(text: string): boolean {
		return text.match(COMMAND_REGEX) !== null;
	}

	buildWidget(context: ViewPluginContext<Host>, commandNodeRef: SyntaxNodeRef): void {
		let scan: SyntaxNode | null = commandNodeRef.node;
		
		while (scan !== null) {
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

		const text = new ButtonWidget(context, this, scan);
		context.builder.add(commandNodeRef.from-1, commandNodeRef.from-1, Decoration.widget({ widget: text }));
		WidgetFormatter.markBasedOnParameters(context, this, commandNodeRef);
	}
}


