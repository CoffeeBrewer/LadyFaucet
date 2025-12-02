import { ethers } from "ethers";
import { Redis } from "@upstash/redis";

const RPC_URL = process.env.RPC_URL;
const SIGNER_PK = process.env.SIGNER_PK;
const FAUCET_ADDRESS = process.env.FAUCET_ADDRESS;
const CHAIN_ID = Number(process.env.CHAIN_ID); // 589

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(req.body || "{}");
  } catch {
    return json(400, { ok: false, error: "Bad JSON" });
  }

  const address = (body.address || "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return json(400, { ok: false, error: "Invalid address" });
  }

  const key = `claimed:${address.toLowerCase()}`;
  const already = await redis.get(key);
  if (already) {
    return json(200, { ok: false, error: "Already claimed" });
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
    const signer = new ethers.Wallet(SIGNER_PK, provider);

    const nonce = ethers.hexlify(ethers.randomBytes(32));

    const msgHash = ethers.solidityPackedKeccak256(
      ["address", "bytes32", "address", "uint256"],
      [address, nonce, FAUCET_ADDRESS, CHAIN_ID]
    );

    const sig = await signer.signMessage(ethers.getBytes(msgHash));

    await redis.set(key, "1");

    return json(200, { ok: true, nonce, sig });
  } catch (e) {
    console.error(e);
    return json(500, { ok: false, error: "Server error" });
  }
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
