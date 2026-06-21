import { getStore } from "@netlify/blobs";
import { ethers } from "ethers";
import { TOKENS } from "./_tokens.js";

// Central hub faucet — handles native LADY + all ERC-20 tokens via TOKENS manifest.
// Race-safe (atomic per-address-per-token lock), blacklist, per-token IP rate limit.

const RPC_URL   = process.env.RPC_URL;
const CHAIN_ID  = Number(process.env.CHAIN_ID || "589");
const FAUCET_PK = process.env.FAUCET_PK;

// Hard blacklist — 14 CBM race-exploit wallets + the operator they consolidated to.
const BLACKLIST = new Set([
  "0x180326e7b4e9be8ce96352eed6d35450906f8093",
  "0x2181a414a12feef758aff2fb7da4e6407191a019",
  "0x0a76e7610c56b4650beb4ebe109bf24aabefa273",
  "0xb7502df57f57ff8494b270e2df04cf6a48edc137",
  "0xd034fc323e8ec74ac34405aa571572a79ed7b1cb",
  "0xfb3c684376551bd83187d29d9815ba3075d0cd12",
  "0xfedd1dbb16d8bb07bfd8aebe8c35631ac8dd2ed6",
  "0x98699d23c958e86626ffed1134a5a9e1f624e2d2",
  "0x30880f85a21eab2725cce57dbbb8706c8bd9cc78",
  "0x2f1226c2db70602c2691f3b9ddb18e984c920ee7",
  "0x4f10b36af96051643af016589085f009a63cc9b1",
  "0x7fb1ded865213f6fd0090d7ee4e25141d7664eac",
  "0x24d86809fe981b08b54a305238c692fb7bc605db",
  "0xe0b88565fa4650ca65666f2f554067bb1411a3af",
  "0x7f2d3f2634ebc7ac992b38f0fa1afb2ae46b4879",
]);

const IP_LIMIT_PER_HOUR = 2; // per IP, per token

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
];

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const reply = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: CORS });

export default async (req) => {
  if (req.method === "OPTIONS") return reply(200, { ok: true });
  if (req.method !== "POST") return reply(405, { ok: false, error: "Method not allowed" });

  try {
    if (!RPC_URL || !FAUCET_PK) {
      return reply(500, { ok: false, error: "Server misconfigured" });
    }

    const body     = await req.json().catch(() => ({}));
    const address  = body.address;
    // Default to LADY if no token specified (back-compat with the existing hero claim).
    const tokenKey = String(body.token || "LADY").toUpperCase();

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return reply(400, { ok: false, error: "Invalid EVM address" });
    }

    const tokenCfg = TOKENS[tokenKey];
    if (!tokenCfg) {
      return reply(400, { ok: false, error: `Unknown token: ${tokenKey}` });
    }

    const addr = address.toLowerCase();

    // Blacklist
    if (BLACKLIST.has(addr)) {
      return reply(403, { ok: false, error: "Address blocked" });
    }

    const claims   = getStore("hub-claims");
    const ipLimits = getStore("hub-ip");
    const lockKey  = `claimed:${tokenKey}:${addr}`;

    // ATOMIC per-address-per-token lock — fixes TOCTOU race that allowed
    // parallel double-claims of the same token.
    try {
      await claims.setJSON(lockKey, { ts: Date.now() }, { onlyIfNone: true });
    } catch {
      return reply(429, { ok: false, error: `Already claimed ${tokenKey}` });
    }
    const releaseLock = () => claims.delete(lockKey).catch(() => {});

    // IP rate limit (per token)
    const ip =
      req.headers.get("x-nf-client-connection-ip") ||
      req.headers.get("x-forwarded-for") ||
      "unknown";
    const ipKey = `ip:${tokenKey}:${ip}`;
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;

    const stored = await ipLimits.get(ipKey, { type: "json" });
    const ipData =
      stored && stored.expiresAt > now
        ? stored
        : { count: 0, expiresAt: now + oneHourMs };
    if (ipData.count >= IP_LIMIT_PER_HOUR) {
      await releaseLock();
      return reply(429, { ok: false, error: `Too many ${tokenKey} requests from this IP` });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== CHAIN_ID) {
      await releaseLock();
      return reply(500, { ok: false, error: "Wrong chain RPC" });
    }

    const wallet = new ethers.Wallet(FAUCET_PK, provider);

    let tx;
    if (tokenCfg.native) {
      // Native LADY
      const amount = ethers.parseEther(tokenCfg.drip);
      const bal = await provider.getBalance(wallet.address);
      if (bal < amount) {
        await releaseLock();
        return reply(400, { ok: false, error: "Faucet empty" });
      }
      try {
        tx = await wallet.sendTransaction({ to: addr, value: amount });
      } catch (e) {
        await releaseLock();
        throw e;
      }
    } else {
      // ERC-20
      const amount = ethers.parseUnits(tokenCfg.drip, tokenCfg.decimals);
      const token  = new ethers.Contract(tokenCfg.contract, ERC20_ABI, wallet);
      const bal    = await token.balanceOf(wallet.address);
      if (bal < amount) {
        await releaseLock();
        return reply(400, { ok: false, error: "Faucet empty" });
      }
      try {
        tx = await token.transfer(addr, amount);
      } catch (e) {
        await releaseLock();
        throw e;
      }
    }

    // Bump IP counter only after a successful claim
    ipData.count += 1;
    await ipLimits.setJSON(ipKey, ipData);

    return reply(200, { ok: true, txHash: tx.hash, token: tokenKey });
  } catch (e) {
    console.error("hub faucet error:", e?.message || "unknown");
    return reply(500, {
      ok: false,
      error: e?.shortMessage || e?.message || "Server error"
    });
  }
};
