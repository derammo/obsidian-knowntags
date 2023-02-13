export interface DerAmmoKnownTagsAPI_V1 {
	scan(): void;
	getTopLevel(tag: string): string | null;
	getMetadata(tag: string, frontMatterSection: string): any | null;
	getChoices(topLevel: string): string[];
}
