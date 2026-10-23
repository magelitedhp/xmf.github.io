/** Create an original PopCap PAK index; payloads remain byte-identical. */
export function buildCompiledPak(entries) {
  const encoder = new TextEncoder();
  const seen = new Set();
  const records = entries.map(([path, data]) => {
    if (typeof path !== 'string' || path.startsWith('/') || path.includes('\\') || path.includes('\0') || path.split('/').some(p => !p || p === '..' || p === '.')) throw new Error('Invalid PAK path');
    const name = encoder.encode(path);
    if (name.length > 255 || !(data instanceof Uint8Array) || seen.has(path.toLowerCase())) throw new Error('Invalid PAK entry');
    seen.add(path.toLowerCase());
    return { name, data };
  });
  const headerLength = 9 + records.reduce((sum, record) => sum + 14 + record.name.length, 0);
  const result = new Uint8Array(headerLength + records.reduce((sum, record) => sum + record.data.length, 0));
  const view = new DataView(result.buffer);
  view.setUint32(0, 0xbac04ac0, true);
  view.setUint32(4, 0, true);
  let position = 8;
  for (const { name, data } of records) {
    result[position++] = 0;
    result[position++] = name.length;
    result.set(name, position); position += name.length;
    view.setUint32(position, data.length, true); position += 4;
    view.setBigUint64(position, 0n, true); position += 8;
  }
  result[position++] = 0x80;
  for (const { data } of records) { result.set(data, position); position += data.length; }
  for (let i = 0; i < result.length; i++) result[i] ^= 0xf7;
  return result;
}
