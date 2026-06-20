import { beforeAll, describe, expect, it } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import {
  SESSION_COOKIE,
  buildSignInMessage,
  verifyWalletSignature,
  signSession,
  verifySessionToken,
  getAuthedAddress,
} from "./auth";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-16-chars-long";
});

// A deterministic ed25519 wallet to stand in for Phantom/Solflare.
function makeWallet() {
  const kp = nacl.sign.keyPair();
  const address = bs58.encode(kp.publicKey);
  const sign = (msg: string) =>
    bs58.encode(nacl.sign.detached(new TextEncoder().encode(msg), kp.secretKey));
  return { address, sign };
}

describe("verifyWalletSignature", () => {
  it("accepts a valid signature over the exact message", () => {
    const w = makeWallet();
    const msg = buildSignInMessage({ domain: "tarani.app", address: w.address, nonce: "abc123" });
    expect(verifyWalletSignature(w.address, msg, w.sign(msg))).toBe(true);
  });

  it("rejects a signature over a different message", () => {
    const w = makeWallet();
    const msg = buildSignInMessage({ domain: "tarani.app", address: w.address, nonce: "abc123" });
    const tampered = buildSignInMessage({
      domain: "tarani.app",
      address: w.address,
      nonce: "DIFFERENT",
    });
    expect(verifyWalletSignature(w.address, tampered, w.sign(msg))).toBe(false);
  });

  it("rejects a signature from a different wallet", () => {
    const a = makeWallet();
    const b = makeWallet();
    const msg = buildSignInMessage({ domain: "tarani.app", address: a.address, nonce: "abc123" });
    expect(verifyWalletSignature(a.address, msg, b.sign(msg))).toBe(false);
  });

  it("rejects garbage input without throwing", () => {
    expect(verifyWalletSignature("not-base58!!", "msg", "also-bad")).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a valid session", () => {
    const now = 1_000_000;
    const token = signSession("WALLET_ADDR", now);
    expect(verifySessionToken(token, now + 1000)).toBe("WALLET_ADDR");
  });

  it("rejects a tampered token", () => {
    const token = signSession("WALLET_ADDR", 1_000_000);
    expect(verifySessionToken(token + "x", 1_000_001)).toBeNull();
    expect(verifySessionToken(token.replace(/\.[^.]+$/, ".deadbeef"), 1_000_001)).toBeNull();
  });

  it("rejects an expired token", () => {
    const now = 1_000_000;
    const token = signSession("WALLET_ADDR", now);
    expect(verifySessionToken(token, now + 8 * 24 * 60 * 60 * 1000)).toBeNull();
  });
});

describe("getAuthedAddress", () => {
  it("reads the address from the session cookie", () => {
    const token = signSession("WALLET_ADDR", 1_000_000);
    const req = new Request("https://tarani.app", {
      headers: { cookie: `other=1; ${SESSION_COOKIE}=${token}` },
    });
    expect(getAuthedAddress(req, 1_000_001)).toBe("WALLET_ADDR");
  });

  it("returns null when there is no session cookie", () => {
    const req = new Request("https://tarani.app", { headers: { cookie: "other=1" } });
    expect(getAuthedAddress(req)).toBeNull();
  });
});
