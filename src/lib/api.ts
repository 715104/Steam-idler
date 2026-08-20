export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has('x-user-id')) {
    headers.set('x-user-id', 'default');
  }
  return fetch(input, {
    ...init,
    headers,
  });
}
