// A BIX üzemeltetője ezen az URL-en tud utánanézni, ki kéri le az oldalt.
export const USER_AGENT = 'bix-dashboard/1.0 (+https://github.com/virtualmokus/bix)';

export async function fetchText(url, { timeoutMs = 20000, retries = 2 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} — ${url}`);
      }
      return await res.text();
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
  }

  throw lastError;
}

export async function fetchJson(url, opts) {
  return JSON.parse(await fetchText(url, opts));
}
