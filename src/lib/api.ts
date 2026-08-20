export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has('x-user-id')) {
    headers.set('x-user-id', 'default');
  }
  const savedPin = typeof window !== 'undefined' ? localStorage.getItem('steam_booster_pin') : null;
  if (savedPin && !headers.has('x-app-pin')) {
    headers.set('x-app-pin', savedPin);
  }
  return fetch(input, {
    ...init,
    headers,
  });
}
