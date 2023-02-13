import { PluginABI, WaitingClient } from "derobst/api";
import { DerAmmoKnownTagsAPI_V1 } from "./api";

const VERSION1 = "derammo.knowntags.v1";

// define storage for all supported APIs
declare global {
    interface Window {
        ["derammo.api"]: {
            providers: {
                [VERSION1]?: DerAmmoKnownTagsAPI_V1;
            };
            clients: {
                [VERSION1]?: WaitingClient<DerAmmoKnownTagsAPI_V1>[];
            };
        };
    }
}

export const DerAmmoKnownTagsABI_V1: PluginABI<DerAmmoKnownTagsAPI_V1> = {
    getAPI: function (): DerAmmoKnownTagsAPI_V1 | undefined {
        return window["derammo.api"].providers[VERSION1];
    },
    setAPI: function (value: DerAmmoKnownTagsAPI_V1): void {
        window["derammo.api"].providers[VERSION1] = value;
    },
    getClients: function (): WaitingClient<DerAmmoKnownTagsAPI_V1>[] {
        return window["derammo.api"].clients[VERSION1];
    },
    setClients: function (clients: WaitingClient<DerAmmoKnownTagsAPI_V1>[]): void {
        window["derammo.api"].clients[VERSION1] = clients;
    }
};
