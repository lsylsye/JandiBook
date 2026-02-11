import api from "@/api/axios";

export const getMyGrass = (params = {}) => {
    return api.get("grass/me/", { params });
};

export const getMyLevel = () => {
    return api.get("grass/level/me/");
};

export const syncTodayGrass = () => {
    return api.post("grass/sync-today/");
};

/** DB에 잔디 데이터가 있는 연도 목록 */
export const getMyGrassYears = () => {
    return api.get("grass/me/years/");
};
