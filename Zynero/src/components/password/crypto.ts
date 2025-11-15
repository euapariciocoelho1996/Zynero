// crypto.ts
export async function deriveKey(masterPassword: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("fixed-salt-or-user-specific"),
      iterations: 150000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptText(key: CryptoKey, plainText: string) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plainText)
  );

  return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function decryptText(key: CryptoKey, encryptedObject: any) {
  const iv = new Uint8Array(encryptedObject.iv);
  const data = new Uint8Array(encryptedObject.data);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}
