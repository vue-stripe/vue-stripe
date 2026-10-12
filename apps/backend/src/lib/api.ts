/**
 * Read a JSON request body, falling back to an empty object when the body is
 * missing or not valid JSON. The shape is not validated at runtime: route
 * handlers treat every field as optional and apply their own defaults.
 */
export async function readJsonBody<T extends object>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    return {} as T
  }
}

/**
 * JSON response from this app's API routes: the success payload `T`, or an
 * object carrying `error` when the request failed (check `response.ok` first).
 */
export type ApiResponse<T> = T & { error?: string }
