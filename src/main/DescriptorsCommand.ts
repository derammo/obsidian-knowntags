import { editorInfoField, getAllTags, MetadataCache, TagCache } from "obsidian";
import { HEADER_NODE_PREFIX, QUOTE_NODE_PREFIX, QUOTE_REGEX } from "src/derobst/ObsidianInternals";
import { SyntaxNode } from "src/derobst/ParsedCommand";
import { ParsedCommandWithSettings } from "src/derobst/ParsedCommandWithSettings";
import { CommandContext } from "src/main/Plugin";

export abstract class DescriptorsCommand extends ParsedCommandWithSettings {
	constructor(private frontMatterSection: string) {
		super();
	}

	protected createDescriptorsCollection(): Set<string> {
		return new Set<string>();
	}

	protected gatherDescriptionSection(descriptors: Set<string>, context: CommandContext): boolean {
		const descriptionHeader: SyntaxNode | null = this.findDescriptionHeader(context);
		if (descriptionHeader !== null) {
			this.gatherDescriptorsFromTags(descriptors, descriptionHeader, context);
			this.ingestDescriptionSection(descriptors, descriptionHeader, context);
			return true;
		}
		return false;
	}

	private gatherDescriptorsFromTags(descriptors: Set<string>, descriptionHeader: SyntaxNode, context: CommandContext): boolean {
		const currentFile = context.view.state.field(editorInfoField).file;
		if (currentFile !== null) {
			const meta = context.plugin.metadataCache.getFileCache(currentFile);
			// if (meta !== null) {
			// 	getAllTags(context.plugin.metadataCache.getFileCache(currentFile)!)?.forEach((value: string) => {
			//		// this also includes tags from frontmatter
			// 		console.log(`UTIL ${currentFile.path} ${value}`);
			// 	});
			// }
			if (meta?.tags !== null) {
				const sectionStart = descriptionHeader.to;
				const sectionEnd = this.commandNode.from;
				meta?.tags?.forEach((tag: TagCache) => {
					// console.log(`${currentFile.path} ${tag.tag} at ${tag.position.start.line}:${tag.position.start.col + 1} (offset ${tag.position.start.offset})`);
					if (tag.position.start.offset >= sectionStart && tag.position.end.offset < sectionEnd) {
						// look up out own meta info about it
						// console.log(`description tag ${tag.tag}`);
						const info = context.plugin.cache.getMetadata(tag.tag.slice(1), this.frontMatterSection);
						if (info !== null && info.hasOwnProperty("prompt")) {
							if (info!.prompt !== null && info!.prompt.length > 0) {
								// explicitly null or empty prompt means ignore this
								// console.log(`description tag ${tag.tag} specifies prompt '${info!.prompt}'`);
								descriptors.add(info!.prompt);
							}
						} else {
							// console.log(`description tag ${tag.tag} using default prompt`);
							const slash = tag.tag.indexOf("/");
							if (slash >= 0) {
								// just use the subpath, as long as the top level tag is registered
								const prompt = tag.tag.slice(slash + 1);
								// console.log(`description tag ${tag.tag} using default prompt ${prompt}`);
								descriptors.add(prompt);
							}
						}
					}
				});
			}
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

	private ingestDescriptionSection(descriptors: Set<string>, descriptionHeader: SyntaxNode, context: CommandContext): void {
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
