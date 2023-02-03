import { HEADER_NODE_PREFIX, QUOTE_NODE_PREFIX, QUOTE_REGEX } from "src/derobst/ObsidianInternals";
import { SyntaxNode } from "src/derobst/ParsedCommand";
import { ParsedCommandWithSettings } from "src/derobst/ParsedCommandWithSettings";
import { CommandContext } from "src/main/Plugin";

export abstract class DescriptorsCommand extends ParsedCommandWithSettings {
	protected createDescriptorsCollection(): Set<string> {
		return new Set<string>();
	}

	protected gatherDescriptionSection(descriptors: Set<string>, context: CommandContext): boolean {
		const descriptionHeader: SyntaxNode | null = this.findDescriptionHeader(context);
		if (descriptionHeader !== null) {
			this.gatherDescriptors(descriptors, descriptionHeader, context);
			return true;
		}
		return false;
	}

	private findDescriptionHeader(context: CommandContext): SyntaxNode | null {
		let scan: SyntaxNode | null = this.commandNode;
		const targetHeaderMatch = new RegExp(`^#+\\s+${this.calculateDescriptionHeaderName(context)}`);

		// console.log(`SEARCH_HEADER ${targetHeaderMatch.source}`);
		while (scan !== null) {
			// console.log(`SEARCH_HEADER ${scan.type.name} '${context.view.state.doc.sliceString(scan.from, scan.to)}'`)
			if (scan.type.name.startsWith(HEADER_NODE_PREFIX)) {
				// check for description name and when we find it, inhale that section
				const value = context.view.state.doc.sliceString(scan.from, scan.to);
				if (value.match(targetHeaderMatch)) {
					return scan;
				}
			}
			scan = scan.prevSibling ?? scan.parent;
		}
		return null;
	}

	private gatherDescriptors(descriptors: Set<string>, descriptionHeader: SyntaxNode, context: CommandContext): void {
		const startHeader = context.view.state.doc.sliceString(descriptionHeader.from, descriptionHeader.to);

		// scan forward from there to where we started or until we find a heading with equal or lower heading level
		let ingest: SyntaxNode | null = descriptionHeader;
		while (ingest !== null) {
			// console.log(`INGEST ${ingest.type.name} '${context.view.state.doc.sliceString(ingest.from, ingest.to)}'`)
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
	}

	private calculateDescriptionHeaderName(context: CommandContext): string {
		// XXX default from plugin settings
		let name: string = "Description";
		if (this.settings.header) {
			name = this.settings.header.toString();
		}
		return name;
	}
}
