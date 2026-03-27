import type { ClarityValue } from "@stacks/transactions";
import { cvToJSON } from "@stacks/transactions";

import type { BytesLike, ParsedClarityResult } from "./types";

export const stripHexPrefix = (value: string): string => {
  if (value.startsWith("0x") || value.startsWith("0X")) {
    return value.slice(2);
  }
  return value;
};

export function hexToBytes(hexValue: string): Uint8Array {
  const normalized = stripHexPrefix(hexValue).trim();
  if (!/^[a-fA-F0-9]*$/.test(normalized)) {
    throw new Error("Invalid hex value.");
  }
  if (normalized.length % 2 !== 0) {
    throw new Error("Hex value must have an even number of characters.");
  }

  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    const byte = Number.parseInt(normalized.slice(i, i + 2), 16);
    out[i / 2] = byte;
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function toBytes(value: BytesLike): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  return new TextEncoder().encode(value);
}

export function toUint(value: bigint | number): bigint {
  const output = typeof value === "bigint" ? value : BigInt(value);
  if (output < 0n) {
    throw new Error("Unsigned integer values must be non-negative.");
  }
  return output;
}

export function ensure32ByteHash(hash: BytesLike): Uint8Array {
  const bytes = typeof hash === "string" ? hexToBytes(hash) : toBytes(hash);
  if (bytes.length !== 32) {
    throw new Error(`Hash must be exactly 32 bytes, received ${bytes.length}.`);
  }
  return bytes;
}

export async function sha256Bytes(input: BytesLike): Promise<Uint8Array> {
  const bytes = toBytes(input);

  if (globalThis.crypto?.subtle) {
    const buffer =
      bytes.buffer instanceof ArrayBuffer
        ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        : Uint8Array.from(bytes).buffer;
    const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
    return new Uint8Array(digest);
  }

  const { createHash } = await import("node:crypto");
  return new Uint8Array(createHash("sha256").update(bytes).digest());
}

export async function sha256Hex(input: BytesLike): Promise<string> {
  return bytesToHex(await sha256Bytes(input));
}

export function parseClarityResult<T = unknown>(cv: ClarityValue): ParsedClarityResult<T> {
  const json = cvToJSON(cv) as Record<string, unknown>;
  return {
    cv,
    json,
    value: (json.value ?? null) as T,
  };
}
