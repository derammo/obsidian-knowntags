import { CachedMetadata, Notice, TFile } from 'obsidian';

export class TagInfo {

}

export class KnownTagsCache {
	initialized: boolean;
	data: { [toplevel: string]: { [subpath: string]: TagInfo; }; } = {};

	// XXX this is wrong, it would be more complicated because we have to figure out which files are affected by folder renames
	// for each top-level tag:
	//   for each subtag path past the top level
	//     ordered list of paths in which definition is found, for rescan
	//     metadata from last definition
	// scan function to scan vault in well defined order
	// only scan specified tags folder if given, for performance
	// XXX for now, warn if duplicate definitions are found and do not guarantee well defined behavior in that case 
	// since we don't know the files' sort order if renames happen
	initialize() {
		if (!this.initialized) {
			this.scan();
			this.initialized = true;
		}
	}

	scan() {
		const files = app.vault.getMarkdownFiles();
		console.log(`scanning ${files.length} markdown files`);
		let tagsDict: { [topLevel: string]: { [subPath: string]: TagInfo; }; } = {};

		// sort by path descending, even though that apparently is already the case
		files.sort((left: TFile, right: TFile) => {
			return right.path.localeCompare(left.path);
		});

		// scan all tag definitions and classify by top level tag
		files.forEach((file: TFile) => {
			let fileMeta = app.metadataCache.getFileCache(file)?.frontmatter;
			if (fileMeta === undefined) {
				return;
			}
			const tagDefinitions = fileMeta['derammo-known-tags'];
			if (tagDefinitions === undefined) {
				return;
			}
			Object.getOwnPropertyNames(tagDefinitions).forEach((key: string) => {
				const slash = key.indexOf("/");
				if (slash < 1) {
					return;
				}
				const tag = key.slice(0, slash);
				const subPath = key.slice(slash + 1);
				let tagRecord: { [subPath: string]: TagInfo; };
				if (tagsDict.hasOwnProperty(tag)) {
					tagRecord = tagsDict[tag];
				} else {
					tagRecord = {};
					tagsDict[tag] = tagRecord;
				}
				if (tagRecord.hasOwnProperty(subPath)) {
					new Notice(`WARNING: multiple definitions of '${key}'; ignoring definition in '${file.path}'`);
					return;
				}
				tagRecord[subPath] = tagDefinitions[key];
			});
		});
		this.data = tagsDict;
		console.log(this.data);
	}

	getTopLevel(tag: string): string | undefined {
		this.initialize();
		const slash = tag.indexOf("/");
		if (slash < 1) {
			return undefined;
		}
		return tag.slice(0, slash);
	}

	getChoices(topLevel: string): string[] {
		this.initialize();
		if (!this.data.hasOwnProperty(topLevel)) {
			return [];
		}
		return Object.getOwnPropertyNames(this.data[topLevel]);
	}

	onMetadataChanged(file: TFile, data: string, cache: CachedMetadata) {
		const metadata = cache?.frontmatter;
		if (metadata === undefined) {
			return;
		}
		const tagDefinitions = metadata['derammo-known-tags'];
		if (tagDefinitions === undefined) {
			return;
		}

		// XXX HACK PREVIEW just scan the world
		this.scan();
	}

	onMetadataDeleted(file: TFile, prevCache: CachedMetadata) {
		// XXX HACK PREVIEW just scan the world
		this.scan();
	}
}