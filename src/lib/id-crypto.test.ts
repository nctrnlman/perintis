import { beforeAll, describe, expect, it } from "vitest";
import { decryptId, encryptId } from "./id-crypto";

beforeAll(() => {
  process.env.ID_ENCRYPTION_KEY = "5XN586GFzoAAKYEKt53T4FZ3N2b6Yjo7zL3Zc+flMCU=";
});

describe("encryptId / decryptId", () => {
  it("round-trips an id", () => {
    const token = encryptId("clx1abc234567890");
    expect(decryptId(token)).toBe("clx1abc234567890");
  });

  it("produces a URL-safe token", () => {
    const token = encryptId("clx1abc234567890");
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces a different token each time (random IV)", () => {
    const a = encryptId("clx1abc234567890");
    const b = encryptId("clx1abc234567890");
    expect(a).not.toBe(b);
  });

  it("returns null for a tampered token", () => {
    const token = encryptId("clx1abc234567890");
    const tampered = token.slice(0, -2) + (token.slice(-2) === "aa" ? "bb" : "aa");
    expect(decryptId(tampered)).toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(decryptId("not-a-real-token")).toBeNull();
  });
});
