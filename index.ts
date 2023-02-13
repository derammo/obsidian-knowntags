import { getAPI } from "derobst/api";

import { DerAmmoKnownTagsAPI_V1 } from "./api";
import { DerAmmoKnownTagsABI_V1 } from "./abi";

export type DerAmmoKnownTagsAPI = DerAmmoKnownTagsAPI_V1;

// client helper
export function getDerAmmoKnownTagsAPI(timeoutMilliseconds?: number): Promise<DerAmmoKnownTagsAPI> {
    return getAPI(DerAmmoKnownTagsABI_V1, timeoutMilliseconds);
}

// if we want to continue to support older versions of the API, we can export them here