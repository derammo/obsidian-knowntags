import { HEADER_NODE_PREFIX, QUOTE_NODE_PREFIX } from "src/derobst/ObsidianInternals";
import { Decoration, SyntaxNode, } from "src/derobst/ParsedCommand";
import { ParsedCommandWithSettings } from "src/derobst/ParsedCommandWithSettings";

import { CommandContext } from "src/main/Plugin";
import { ButtonWidget } from "./ButtonWidget";

const COMMAND_REGEX = /^\s*!character-random-description(?:\s(.*)|$)/;
const QUOTE_REGEX = /^\s*>([^`]*)(`|$)/

export class Command extends ParsedCommandWithSettings {
	get regex(): RegExp {
		return COMMAND_REGEX;
	}

	static match(text: string): boolean {
		return text.match(COMMAND_REGEX) !== null;
	}

	buildWidget(context: CommandContext): void {
		const descriptionHeaderName = this.calculateDescriptionHeaderName(context);
		let scan: SyntaxNode | null = this.commandNode;
		let descriptors: Set<string> = new Set<string>();

		const targetHeaderMatch = new RegExp(`^#+\\s+${this.calculateDescriptionHeaderName(context)}`)
		// console.log(`SEARCH_HEADER ${targetHeaderMatch.source}`);
		while (scan !== null) {
			// console.log(`SEARCH_HEADER ${scan.type.name} '${context.view.state.doc.sliceString(scan.from, scan.to)}'`)
			if (scan.type.name.startsWith(HEADER_NODE_PREFIX)) {
				// check for description name and when we find it, inhale that section
				const value = context.view.state.doc.sliceString(scan.from, scan.to);
				if (value.match(targetHeaderMatch)) {
					this.gatherDescriptors(descriptors, value, scan, context);
					break;
				}
			}
			scan = scan.prevSibling;
		}
		
		// XXX gather from tags
		const text = new ButtonWidget(context.plugin, this, descriptors);
		context.builder.add(this.commandNode.from-1, this.commandNode.from-1, Decoration.widget({ widget: text }));
		context.markWithBehaviorClasses(this);
	}

	private gatherDescriptors(descriptors: Set<string>, value: string, scan: SyntaxNode, context: CommandContext) {
		const startHeader = value;

		// scan forward from there to where we started or until we find a heading with equal or lower heading level
		let ingest: SyntaxNode | null = scan;
		while (ingest !== null) {
			console.log(`INGEST ${scan.type.name} '${context.view.state.doc.sliceString(scan.from, scan.to)}'`)
			if (ingest.type.name.startsWith(QUOTE_NODE_PREFIX)) {
				const quote = context.view.state.doc.sliceString(ingest.from, ingest.to);
				const match = quote.match(QUOTE_REGEX);
				if (match !== null) {
					const descriptor = match[1].trim();
					if (descriptor.length > 0) {
						descriptors.add(descriptor);
					}
				}
			}
			ingest = ingest.nextSibling;
			if (ingest !== null && ingest.type.name.startsWith(HEADER_NODE_PREFIX) && ingest.type.name.localeCompare(startHeader) <= 0) {
				// end of section
				break;
			}
		}
		return descriptors;
	}

	calculateDescriptionHeaderName(context: CommandContext): string {
		// XXX default from plugin settings
		let name: string = "Description";
		if (this.settings.header) {
			name = this.settings.header.toString();
		}
		return name;
	}
}


