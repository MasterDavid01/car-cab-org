import type { User } from "firebase/auth";

import { buildApiUrl } from "./apiBase";

type BackendRequestOptions = RequestInit & {
  expectText?: boolean;
};

async function parseBackendResponse(response: Response, expectText?: boolean) {
  const rawText = await response.text();
  const payload = expectText ? rawText : rawText ? safeJsonParse(rawText) : null;

  if (!response.ok || (!expectText && payload?.success === false)) {
    const message = expectText
      ? rawText || `backend_${response.status}`
      : payload?.error || payload?.message || `backend_${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function buildHeaders(options?: RequestInit, extraHeaders?: Record<string, string>) {
  return {
    ...(options?.body ? { "Content-Type": "application/json" } : null),
    ...(extraHeaders || {}),
    ...((options?.headers as Record<string, string> | undefined) || {}),
  };
}

async function authorizedHeaders(user: User, extraHeaders?: Record<string, string>) {
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    ...(extraHeaders || {}),
  };
}

export async function backendJson(path: string, options?: BackendRequestOptions) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: buildHeaders(options),
  });

  return parseBackendResponse(response, options?.expectText);
}

export async function authJson(user: User, path: string, options?: BackendRequestOptions) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: buildHeaders(options, await authorizedHeaders(user)),
  });

  return parseBackendResponse(response, options?.expectText);
}

export async function adminJson(user: User, path: string, options?: BackendRequestOptions) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: buildHeaders(
      options,
      await authorizedHeaders(user, {
        "x-admin-user": user.email || user.uid,
      })
    ),
  });

  return parseBackendResponse(response, options?.expectText);
}

export function jsonBody(payload: unknown) {
  return JSON.stringify(payload);
}