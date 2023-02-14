import { getAPI } from "derobst/api";

import { DerAmmoKnownTagsABI_V1, DerAmmoKnownTagsAPI_V1 } from "./api";

export type DerAmmoKnownTagsAPI = DerAmmoKnownTagsAPI_V1;

// client helper
export function getDerAmmoKnownTagsAPI(timeoutMilliseconds?: number): Promise<DerAmmoKnownTagsAPI> {
    return getAPI(DerAmmoKnownTagsABI_V1, timeoutMilliseconds);
}

// All new client code will only see the latest version of the API, while older clients will still
// ask for the older version via previous ABI records.  We can continue to support these older
// APIs by calling publishAPI() for them.