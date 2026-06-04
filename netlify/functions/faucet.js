import { getStore } from "@netlify/blobs";
import { ethers } from "ethers";

const RPC_URL = process.env.RPC_URL;
const CHAIN_ID = Number(process.env.CHAIN_ID || "589");
const FAUCET_PK = process.env.FAUCET_PK;
const DRIP_AMOUNT = ethers.parseEther("0.1"); // 0.1 LADY native

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

    const { address } = await req.json().catch(() => ({}));
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return reply(400, { ok: false, error: "Invalid EVM address" });
    }

    const addr = address.toLowerCase();
    const claims = getStore("faucet-claims");
    const ipLimits = getStore("faucet-ip");

    // 1) 1x per wallet
    if (await claims.get(`claimed:${addr}`)) {
      return reply(429, { ok: false, error: "Already claimed" });
    }

    // 2) IP rate limit (5 per uur)
    const ip =
      req.headers.get("x-nf-client-connection-ip") ||
      req.headers.get("x-forwarded-for") ||
      "unknown";
    const ipKey = `ip:${ip}`;
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;

    const stored = await ipLimits.get(ipKey, { type: "json" });
    const ipData =
      stored && stored.expiresAt > now
        ? stored
        : { count: 0, expiresAt: now + oneHourMs };
    if (ipData.count >= 5) {
      return reply(429, { ok: false, error: "Too many requests from this IP" });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== CHAIN_ID) {
      return reply(500, { ok: false, error: "Wrong chain RPC" });
    }

    const faucetWallet = new ethers.Wallet(FAUCET_PK, provider);

    // 3) check balance faucet wallet
    const bal = await provider.getBalance(faucetWallet.address);
    if (bal < DRIP_AMOUNT) {
      return reply(400, { ok: false, error: "Faucet empty" });
    }

    // 4) send native LADY
    const tx = await faucetWallet.sendTransaction({
      to: addr,
      value: DRIP_AMOUNT
    });

    // 5) mark claimed + bump IP counter
    await claims.set(`claimed:${addr}`, "1");
    ipData.count += 1;
    await ipLimits.setJSON(ipKey, ipData);

    return reply(200, { ok: true, txHash: tx.hash });
  } catch (e) {
    console.error("faucet send error:", e?.message || "unknown");
    return reply(500, {
      ok: false,
      error: e?.shortMessage || e?.message || "Server error"
    });
  }
};
