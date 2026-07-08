/**
 * Tiny fetch wrappers for the client components under app/(learn)/** and
 * app/login/**. Mirrors the API contracts in app/api/** (never re-implements
 * business logic — just parses/serializes JSON for the fetch call site).
 */

export interface ApiError {
  code: string;
  message_zh: string;
}

export class ApiRequestError extends Error {
  code: string;
  constructor(err: ApiError) {
    super(err.message_zh);
    this.code = err.code;
  }
}

// fetch() is not basePath-aware (only <Link>/router are). Under the /english
// deployment a bare "/api/..." would resolve to the origin root and 404, so
// every call site must go through the baked basePath.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const apiUrl = (path: string) => `${BASE_PATH}${path}`;

async function getJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ApiRequestError({
      code: "network_error",
      message_zh: "网络好像断开了，检查一下网络再试试。",
    });
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiRequestError({
      code: "bad_response",
      message_zh: "服务器返回的内容有点奇怪，请重试。",
    });
  }
  if (!res.ok) {
    const err = (json as { error?: ApiError }).error;
    throw new ApiRequestError(
      err ?? { code: "unknown_error", message_zh: "出了点问题，请重试。" },
    );
  }
  return json as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError({
      code: "network_error",
      message_zh: "网络好像断开了，检查一下网络再试试。",
    });
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiRequestError({
      code: "bad_response",
      message_zh: "服务器返回的内容有点奇怪，请重试。",
    });
  }

  if (!res.ok) {
    const err = (json as { error?: ApiError }).error;
    throw new ApiRequestError(
      err ?? { code: "unknown_error", message_zh: "出了点问题，请重试。" },
    );
  }
  return json as T;
}

export interface LoginResult {
  user: { uid: number; name: string; role: "admin" | "learner" };
}

export function login(name: string, password: string): Promise<LoginResult> {
  return postJson<LoginResult>(apiUrl("/api/auth/login"), { name, password });
}

export function logout(): Promise<{ ok: true }> {
  return postJson<{ ok: true }>(apiUrl("/api/auth/logout"), {});
}

export type SubmitResponse =
  | { type: "mcq"; index: number }
  | { type: "cloze"; responses: string[] }
  | { type: "correct"; index: number; text: string };

export type SubmissionResult =
  | { type: "mcq"; correct: boolean }
  | { type: "minimal_pair"; correct: boolean }
  | { type: "cloze"; correct: boolean; blanks: boolean[] }
  | {
      type: "correct";
      correct: boolean;
      positionCorrect: boolean;
      correctionCorrect: boolean;
      score: 0 | 0.5 | 1;
    };

export interface SubmitExerciseResult {
  result: SubmissionResult;
  explain_zh: string | null;
}

export function submitExercise(
  exerciseId: number,
  response: unknown,
  opts?: { usedHint?: boolean; msUsed?: number },
): Promise<SubmitExerciseResult> {
  return postJson<SubmitExerciseResult>(apiUrl("/api/exercises/submit"), {
    exercise_id: exerciseId,
    response,
    used_hint: opts?.usedHint ?? false,
    ms_used: opts?.msUsed,
  });
}

export interface QueueExercise {
  id: number;
  uid: string;
  type: string;
  payloadJson: unknown;
  explainZh: string | null;
}

export function getReviewQueue(): Promise<{ exercises: QueueExercise[] }> {
  return getJson<{ exercises: QueueExercise[] }>(apiUrl("/api/srs/queue"));
}
