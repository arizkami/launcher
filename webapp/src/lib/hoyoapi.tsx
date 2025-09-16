// src/core/hoyoapi.tsx
import { getGlobalLanguage } from '../utils/languageUtils';
import { GenshinImpactGame, HonkaiStarRailGame,ZenlessGame } from '../data/gameitems';

const BASE_URL = "/api/getGameContent";
const BANNER_URL = "/api/getGames";
const BASICINFO_URL = "/api/getAllGameBasicInfo";
const GAME_RESOURCES_URL = "/api/getGamePackages";
const GETGAME_RESOURCES_URL = "/api/getGameBranches";
const LAUNCHER_ID = "VYTpXlbWo8";

// const GAME_ID = "gopR6Cufr3";

const GAME_ID_MAP = {
    [GenshinImpactGame]: "gopR6Cufr3",
    [HonkaiStarRailGame]: "4ziysqXOQ8",
    [ZenlessGame]: "U5hbdsT9W7",
}

export const HoYoApi = (game: keyof typeof GAME_ID_MAP): string => {
    const language = getGlobalLanguage();
    if (game in GAME_ID_MAP) {
        return `${BASE_URL}?launcher_id=${LAUNCHER_ID}&game_id=${GAME_ID_MAP[game as keyof typeof GAME_ID_MAP]}&language=${language}`;
    }
    throw new Error(`Invalid game type: ${game}`);
};

export const resGameBranches = (game: keyof typeof GAME_ID_MAP): string => {
    return `${GETGAME_RESOURCES_URL}?game_ids[]=${GAME_ID_MAP[game as keyof typeof GAME_ID_MAP]}&launcher_id=${LAUNCHER_ID}`;
}
//@ts-expect-error
export const resBackground = (game: keyof typeof GAME_ID_MAP): string => {
    const language = getGlobalLanguage();
    return `${BANNER_URL}?launcher_id=${LAUNCHER_ID}&language=${language}`;
};

export const resBasicInfo = (game: keyof typeof GAME_ID_MAP): string => {
    const language = getGlobalLanguage();
    return `${BASICINFO_URL}?launcher_id=${LAUNCHER_ID}&language=${language}&game_id=${GAME_ID_MAP[game]}`; 
};

export const resGameResources = (game: keyof typeof GAME_ID_MAP): string => {
    return `${GAME_RESOURCES_URL}?launcher_id=${LAUNCHER_ID}&game_id=${GAME_ID_MAP[game]}`;
};

export const getAllGameBasicInfo = (game: keyof typeof GAME_ID_MAP): string => {
    return resBasicInfo(game);
};

export const HoYoBackground = (game: keyof typeof GAME_ID_MAP): string => {
   return resBackground(game);
};

export const HoYoNewsGenshin = (game: keyof typeof GAME_ID_MAP): string => {
    return HoYoApi(game);
};