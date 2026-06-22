#!/usr/bin/env node
// Scan-only: collects every address that received a drip from the OLD funding
// wallet, per token. Writes /tmp/claims-to-migrate.json. Does NOT write to
// Netlify Blobs — that's a separate step once we see the counts.

import { faucets } from "../src/faucets.js";

const OLD_WALLET = "0x966FC3c318b145349A036627E73eC43ebdB998D8";
const NEW_WALLET = "0x8e1B10b7A34aA4D7535c9435bBa963FFB2F34553";
const RPC = process.env.RPC || "http://localhost:8545";
const SCAN = "https://ladyscan.us";

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const fromTopic = "0x" + "0".repeat(24) + OLD_WALLET.slice(2).toLowerCase();
const newWalletLc = NEW_WALLET.toLowerCase();
const oldWalletLc = OLD_WALLET.toLowerCase();

// Map: token contract (lowercase) -> ticker
const CONTRACTS = new Map(
  faucets.filter(f => !f.native).map(f => [f.contract.toLowerCase(), f.ticker])
);

async function rpc(method, params) {
  const r = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const j = await r.json();
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result;
}

async function scanErc20Drips() {
  const head = parseInt(await rpc("eth_blockNumber", []), 16);
  console.log(`[ERC-20] scanning ${head + 1} blocks for Transfer from ${OLD_WALLET}`);

  const out = {}; // ticker -> Set<recipient>
  const CHUNK = 5000;

  for (let from = 0; from <= head; from += CHUNK) {
    const to = Math.min(from + CHUNK - 1, head);
    let logs;
    try {
      logs = await rpc("eth_getLogs", [{
        fromBlock: "0x" + from.toString(16),
        toBlock:   "0x" + to.toString(16),
        topics: [TRANSFER_TOPIC, fromTopic],
      }]);
    } catch (e) {
      console.error(`  chunk ${from}-${to} failed: ${e.message} — retrying once`);
      await new Promise(r => setTimeout(r, 1500));
      logs = await rpc("eth_getLogs", [{
        fromBlock: "0x" + from.toString(16),
        toBlock:   "0x" + to.toString(16),
        topics: [TRANSFER_TOPIC, fromTopic],
      }]);
    }

    for (const log of logs) {
      const ticker = CONTRACTS.get(log.address.toLowerCase());
      if (!ticker) continue; // not one of our manifest tokens
      const recipient = "0x" + log.topics[2].slice(-40).toLowerCase();
      if (recipient === newWalletLc) continue; // migration tx, not a drip
      (out[ticker] ??= new Set()).add(recipient);
    }

    if (from % (CHUNK * 20) === 0) {
      process.stdout.write(`  ${from}/${head} `);
      for (const [t, s] of Object.entries(out)) process.stdout.write(`${t}:${s.size} `);
      process.stdout.write("\n");
    }
  }
  // Set → array
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
}

async function scanLadyDrips() {
  console.log(`[LADY native] pulling outgoing txs via ladyscan API`);
  const recipients = new Set();
  let page = 1;
  let pages = 0;
  let totalSeen = 0;

  while (page && pages < 500) {
    const url = `${SCAN}/api/v2/addresses/${OLD_WALLET}/transactions?filter=from&page=${page}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`ladyscan ${r.status}`);
    const j = await r.json();
    const items = j.items || [];
    totalSeen += items.length;
    for (const tx of items) {
      if ((tx.from_address || "").toLowerCase() !== oldWalletLc) continue;
      const to = (tx.to_address || "").toLowerCase();
      if (!to || to === newWalletLc) continue;
      const val = BigInt(tx.value || "0");
      if (val === 0n) continue;
      // Pure value transfer (no contract call) → drip
      const input = tx.input || "0x";
      if (input !== "0x" && input !== "") continue;
      recipients.add(to);
    }
    pages++;
    const np = j.next_page_params;
    if (!np || items.length === 0) break;
    page = np.page;
  }
  console.log(`  ${recipients.size} unique LADY recipients (saw ${totalSeen} outgoing txs across ${pages} pages)`);
  return [...recipients];
}

(async () => {
  const erc20 = await scanErc20Drips();
  const lady  = await scanLadyDrips();

  const all = { LADY: lady, ...erc20 };
  const summary = Object.fromEntries(
    Object.entries(all).map(([k, v]) => [k, v.length])
  );
  console.log("\nSummary:", summary);

  const path = "/tmp/claims-to-migrate.json";
  await import("fs").then(fs => fs.writeFileSync(path, JSON.stringify(all, null, 2)));
  console.log(`Wrote ${path}`);
})().catch(e => { console.error(e); process.exit(1); });
