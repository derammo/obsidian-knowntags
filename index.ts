import { getAPI } from "derobst/api";

import { DerAmmoKnownTagsABI_V1 } from "./abi";
import { DerAmmoKnownTagsAPI_V1 } from "./api";

export type DerAmmoKnownTagsAPI = DerAmmoKnownTagsAPI_V1;

export function getDerAmmoKnownTagsAPI(timeoutMilliseconds?: number): Promise<DerAmmoKnownTagsAPI> {
    return getAPI(DerAmmoKnownTagsABI_V1, timeoutMilliseconds);
}