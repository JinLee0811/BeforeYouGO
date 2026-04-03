/**
 * fetch 응답이 HTML 에러 페이지일 때 response.json() 이 SyntaxError 나는 것을 방지.
 */
export async function parseApiJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  const start = text.trimStart().slice(0, 64).toLowerCase();
  if (start.startsWith("<!doctype") || start.startsWith("<html")) {
    throw new Error(
      `Server returned HTML instead of JSON (HTTP ${response.status}). Check the API route, proxy, or URL.`
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(
      `JSON parse failed (HTTP ${response.status}): ${text.slice(0, 200).replace(/\s+/g, " ")}`
    );
  }
}
