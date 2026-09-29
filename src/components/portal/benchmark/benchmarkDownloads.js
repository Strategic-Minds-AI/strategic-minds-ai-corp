export function downloadBenchmark(value, name, type = 'application/json') {
  const content = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}
export async function copyBenchmark(text) { await navigator.clipboard.writeText(text); }