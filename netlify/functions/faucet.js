import { Redis } from "@upstash/redis";
import { ethers } from "ethers";

const redis = Redis.fromEnv();

const RPC_URL = process.env.RPC_URL;
const CHAIN_ID = Number(process.env.CHAIN_ID || "589");
const FAUCET_ADDRESS = process.env.FAUCET_ADDRESS;
const SIGNER_PK = process.env.SIGNER_PK;

// simpele helper
function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      // basic CORS
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
    body: JSON.stringify(body)
  };
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  try {
    if (!RPC_URL || !FAUCET_ADDRESS || !SIGNER_PK) {
      return json(500, {
        ok: false,
        error: "Missing env vars (RPC_URL / FAUCET_ADDRESS / SIGNER_PK)"
      });
    }

    const { address } = JSON.parse(event.body || "{}");
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return json(400, { ok: false, error: "Invalid EVM address" });
    }

    const addr = address.toLowerCase();

    // 1) 1x per wallet check in Upstash
    const claimKey = `claimed:${addr}`;
    const already = await redis.get(claimKey);
    if (already) {
      return json(429, { ok: false, error: "Already claimed" });
    }

    // 2) check faucet balance (optioneel maar handig)
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(FAUCET_ADDRESS);
    const drip = ethers.parseEther("0.1");

    if (balance < drip) {
      return json(400, { ok: false, error: "Faucet empty" });
    }

    // 3) maak nonce + signature
    const nonce = ethers.hexlify(ethers.randomBytes(32));
    const wallet = new ethers.Wallet(SIGNER_PK);

    const msgHash = ethers.keccak256(
      ethers.solidityPacked(
        ["address", "bytes32", "address", "uint256"],
        [addr, nonce, FAUCET_ADDRESS, CHAIN_ID]
      )
    );

    const sig = await wallet.signMessage(ethers.getBytes(msgHash));

    // 4) markeer als geclaimd
    await redis.set(claimKey, "1");

    return json(200, {
      ok: true,
      nonce,
      sig
    });
  } catch (e) {
    console.error("faucet function error:", e);
    return json(500, {
      ok: false,
      error: e?.message || "Server error"
    });
  }
}
