export function tFrom(translations, key, fallback) {
  const parts = String(key || '').split('.').filter(Boolean);
  let cur = translations;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return fallback;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : fallback;
}

