import { DefaultABI } from "derobst/api";

const VERSION1 = "derammo.knowntags.v1";
export interface DerAmmoKnownTagsAPI_V1 {
	scan(): void;
	getTopLevel(tag: string): string | null;
	getMetadata(tag: string, frontMatterSection: string): any | null;
	getChoices(topLevel: string): string[];
}

// this freezes the contract of where to find the api interface in the client that imports this code
export const DerAmmoKnownTagsABI_V1 = new DefaultABI<DerAmmoKnownTagsAPI_V1>(VERSION1);
