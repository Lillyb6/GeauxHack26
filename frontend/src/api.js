export async function api(path, body) {
  const response = await fetch(`/api${path}`, body === undefined ? {} : {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Request failed (${response.status}). Check your inputs and the backend. ${detail.slice(0,180)}`);
  }
  return response.json();
}
