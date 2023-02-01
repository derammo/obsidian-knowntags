import { KnownTagsCache } from './KnownTagsCache';
import { KnownTagsSettings } from "KnownTagsSettings";

export interface KnownTagsHost {
	cache: KnownTagsCache;
	settings: KnownTagsSettings;
	settingsDirty: boolean;
};
