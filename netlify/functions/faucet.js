import { Redis } from "@upstash/redis";
import { ethers } from "ethers";

const redis = Redis.fromEnv();

const RPC_URL = process.env.RPC_URL;
const CHAIN_ID = Number(process.env.CHAIN_ID || "589");
const FAUCET_PK = process.env.FAUCET_PK; // <-- NIEUW
const DRIP_AMOUNT = ethers.parseEther("0.1"); // 0.1 LADY native

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
    body: JSON.stringify(body)
  };
}

export async function handler(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  try {
    if (!RPC_URL || !FAUCET_PK) {
      return json(500, {
        ok: false,
        error: "Missing env vars (RPC_URL / FAUCET_PK)"
      });
    }

    const { address } = JSON.parse(event.body || "{}");
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return json(400, { ok: false, error: "Invalid EVM address" });
    }

    const addr = address.toLowerCase();

    // 1) 1x per wallet
    const claimKey = `claimed:${addr}`;
    const already = await redis.get(claimKey);
    if (already) {
      return json(429, { ok: false, error: "Already claimed" });
    }

    // 2) optionele simpele IP rate limit (anti-spam)
    const ip =
      event.headers["x-nf-client-connection-ip"] ||
      event.headers["x-forwarded-for"] ||
      "unknown";
    const ipKey = `ip:${ip}`;
    const ipCount = (await redis.get(ipKey)) || 0;
    if (Number(ipCount) >= 5) {
      return json(429, { ok: false, error: "Too many requests from this IP" });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== CHAIN_ID) {
      return json(500, { ok: false, error: "Wrong chain RPC" });
    }

    const faucetWallet = new ethers.Wallet(FAUCET_PK, provider);

    // 3) check balance faucet wallet
    const bal = await provider.getBalance(faucetWallet.address);
    if (bal < DRIP_AMOUNT) {
      return json(400, { ok: false, error: "Faucet empty" });
    }

    // 4) send native LADY
    const tx = await faucetWallet.sendTransaction({
      to: addr,
      value: DRIP_AMOUNT
    });

    // 5) mark claimed + ip throttle
    await redis.set(claimKey, "1");
    await redis.set(ipKey, String(Number(ipCount) + 1), { ex: 60 * 60 }); // 1 uur

    return json(200, { ok: true, txHash: tx.hash });
  } catch (e) {
    console.error("faucet send error:", e);
    return json(500, {
      ok: false,
      error: e?.shortMessage || e?.message || "Server error"
    });
  }
}
