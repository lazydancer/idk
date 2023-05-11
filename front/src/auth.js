import { getCookie } from 'svelte-cookie';

export async function authFetch(url, options = {}) {
  const cookie = JSON.parse(getCookie('idkCookie'));

  if (cookie.token) {
    options.headers = {
      ...options.headers,
      'Authorization': cookie.token
    };
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}