import OpenAI, {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  RateLimitError,
} from "openai";

const globalForOpenAI = globalThis as typeof globalThis & {
  openai?: OpenAI;
};

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!globalForOpenAI.openai) {
    globalForOpenAI.openai = new OpenAI({ apiKey });
  }

  return globalForOpenAI.openai;
}

const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 500;

function isTransientOpenAIError(error: unknown): boolean {
  if (
    error instanceof RateLimitError ||
    error instanceof APIConnectionTimeoutError ||
    error instanceof APIConnectionError
  ) {
    return true;
  }

  if (error instanceof APIError && typeof error.status === "number" && error.status >= 500) {
    return true;
  }

  return false;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an OpenAI SDK call with exponential backoff retries for transient
 * failures (rate limits, connection errors/timeouts, and 5xx responses).
 * Non-transient errors are re-thrown immediately without retrying.
 */
export async function withOpenAIRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
): Promise<T> {
  let attempt = 0;

  for (;;) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;

      if (attempt >= maxAttempts || !isTransientOpenAIError(error)) {
        throw error;
      }

      await delay(BASE_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }
}

