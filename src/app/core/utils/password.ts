// Local simulation only; production credentials will be managed by Supabase Auth.
export async function hashPassword(password: string, salt: string): Promise<string> {
 const encoder = new TextEncoder();
 const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
 const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000 }, key, 256);
 return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
}
