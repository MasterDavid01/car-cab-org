const configuredApiBaseUrl = String(process.env.EXPO_PUBLIC_API_BASE_URL || "").trim().replace(/\/$/, "");

export const API_BASE_URL = configuredApiBaseUrl;

export function requireApiBaseUrl() {
	if (!API_BASE_URL) {
		throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured.");
	}

	return API_BASE_URL;
}

export function buildApiUrl(path = "") {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${requireApiBaseUrl()}${normalizedPath}`;
}
