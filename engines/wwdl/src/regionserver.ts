export const REGION_SERVERS = {
    "live": {
        "cn": "https://prod-cn-alicdn-gamestarter.kurogame.com/launcher/game/G152/10003_Y8xXrXk65DqFHEDgApn3cpK5lfczpFx5/index.json",
        "os": "https://prod-alicdn-gamestarter.kurogame.com/launcher/game/G153/50004_obOHXFrFanqsaIEOmuKroCcbZkQRBC7c/index.json"
    },
    "beta": {
        "cn": "https://prod-cn-alicdn-gamestarter.kurogame.com/launcher/game/G152/10003_Y8xXrXk65DqFHEDgApn3cpK5lfczpFx5/index.json",
        "os": "https://prod-alicdn-gamestarter.kurogame.com/launcher/game/G153/50004_obOHXFrFanqsaIEOmuKroCcbZkQRBC7c/index.json"
    }
};

export const GIST_INDEX_URL = "https://gist.githubusercontent.com/yuhkix/b8796681ac2cd3bab11b7e8cdc022254/raw/4435fd290c07f7f766a6d2ab09ed3096d83b02e3/wuwa.json";

export interface ServerConfig {
    category: "live" | "beta";
    region: "cn" | "os";
    label: string;
}

export const SERVER_OPTIONS: ServerConfig[] = [
    { category: "live", region: "os", label: "Live - OS" },
    { category: "live", region: "cn", label: "Live - CN" },
    { category: "beta", region: "os", label: "Beta - OS" },
    { category: "beta", region: "cn", label: "Beta - CN" }
];