import { getCookie } from 'svelte-cookie';

export async function authFetch(url, options = {}) {
  const token = getCookie('token');

  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': token
    };
  }

  const response = await fetch(url, options);

  console.log(response)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}