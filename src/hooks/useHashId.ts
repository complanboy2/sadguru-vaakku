import { useCallback } from 'react';

export function useHashId(total: number) {
  return useCallback(async (str: string) => {
    const ts = Date.now().toString();
    const data = new TextEncoder().encode(str + ts);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(digest));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    const num = parseInt(hex.slice(0, 12), 16);      // use first 48 bits
    return (num % total) + 1; // 1…total
  }, [total]);
}
