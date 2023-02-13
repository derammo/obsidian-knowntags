import { PluginABI, PluginInterface } from "derobst/api";
import { DerAmmoKnownTagsAPI_V1 } from "./api";

const VERSION1 = "derammo.knowntags.v1";

// define storage for all supported APIs
declare global {
    interface Window {
        ["derammo.api"]: {
            interfaces: {
                [VERSION1]?: PluginInterface<DerAmmoKnownTagsAPI_V1>
            };
        };
    }
}

// this code checks the types of the individual records in the interfaces collection
// and freezes the binary contract in the client that imports this code
export const DerAmmoKnownTagsABI_V1: PluginABI<DerAmmoKnownTagsAPI_V1> = {
    initializeInterface: function (record: PluginInterface<DerAmmoKnownTagsAPI_V1>): void {
        window["derammo.api"] = window["derammo.api"] ?? { interfaces: {} };
        window["derammo.api"].interfaces[VERSION1] = record;
    },
    getInterface: function (): PluginInterface<DerAmmoKnownTagsAPI_V1> | undefined {
        return window["derammo.api"].interfaces[VERSION1];
    }
};
