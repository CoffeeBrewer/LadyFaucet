import { useEffect, useState } from "react";
import { FUNDING_WALLET } from "./faucets";

const RPC = "https://rpc.ladyrpc.us";

async function rpc(method, params) {
  const r = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  return (await r.json()).result;
}

// minimal parseUnits — handles "1,000" / "0.00001" / "50,000,000"
function parseUnits(amountStr, decimals) {
  const clean = String(amountStr).replace(/,/g, "");
  const [whole, frac = ""] = clean.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * (10n ** BigInt(decimals)) + BigInt(fracPadded || "0");
}

/**
 * Returns availability per token ticker:
 *   "checking" — initial state, balances not yet loaded
 *   "live"     — funding wallet has at least one drip
 *   "empty"    — funding wallet doesn't have enough for one drip
 */
export function useBalances(tokens) {
  const [state, setState] = useState(() =>
    Object.fromEntries(tokens.map((t) => [t.ticker, "checking"]))
  );

  useEffect(() => {
    let alive = true;
    async function load() {
      const out = {};
      await Promise.all(
        tokens.map(async (t) => {
          try {
            let bal;
            if (t.native) {
              const hex = await rpc("eth_getBalance", [FUNDING_WALLET, "latest"]);
              bal = BigInt(hex);
            } else {
              const data =
                "0x70a08231" + "0".repeat(24) + FUNDING_WALLET.slice(2).toLowerCase();
              const hex = await rpc(
                "eth_call",
                [{ to: t.contract, data }, "latest"]
              );
              bal = BigInt(hex || "0x0");
            }
            const dripWei = parseUnits(t.drip, t.decimals);
            out[t.ticker] = bal >= dripWei ? "live" : "empty";
          } catch {
            // network hiccup — leave as checking so user can still try
            out[t.ticker] = "checking";
          }
        })
      );
      if (alive) setState(out);
    }
    load();
    const id = setInterval(load, 60_000); // refresh every minute
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [tokens]);

  return state;
}
