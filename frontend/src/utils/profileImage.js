/**
 * 프로필 이미지 URL 정리 (기본 이미지 상수 + 쓸 수 없는 URL이면 기본으로 치환)
 */
const BASE_URL = import.meta.env?.VITE_BASE_URL || "http://127.0.0.1:8000";

export const DEFAULT_PROFILE_IMAGE =
  "https://jandibook.up.railway.app/media/profiles/default_profile.jpg";

const USE_DEFAULT = /placeholder\.com|via\.placeholder|default_profile\.png/;

/**
 * @param {string} [url] - API에서 받은 profile_image 값
 * @returns {string} - img src에 넣을 URL (쓸 수 없으면 DEFAULT_PROFILE_IMAGE)
 */
export function resolveProfileImage(url) {
  if (!url) return DEFAULT_PROFILE_IMAGE;
  if (USE_DEFAULT.test(String(url))) return DEFAULT_PROFILE_IMAGE;
  if (String(url).startsWith("http")) return url;
  return `${BASE_URL}${String(url).startsWith("/") ? "" : "/"}${url}`;
}
