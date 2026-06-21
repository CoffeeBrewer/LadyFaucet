import { useEffect, useState } from "react";

const RPC = "https://rpc.ladyrpc.us";
const BS  = "https://ladyscan.us/api/v2";

async function rpc(method, params = []) {
  const r = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  return (await r.json()).result;
}
const fmt = (n) => (n == null ? "—" : new Intl.NumberFormat("en-US").format(n));

export default function StatsBar() {
  const [block, setBlock] = useState(null);
  const [tx, setTx]       = useState(null);
  const [addr, setAddr]   = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const latest = parseInt(await rpc("eth_blockNumber"), 16);
        if (alive) setBlock(latest);
        const stats = await fetch(BS + "/stats").then(r => r.json()).catch(() => null);
        if (stats && alive) {
          setTx(parseInt(stats.total_transactions));
          setAddr(parseInt(stats.total_addresses));
        }
      } catch {}
    }
    load();
    const id = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="stats-bar">
      <span className="stats-dot" />
      <div className="stat-cluster">
        <span className="stat-k">Block</span>
        <span className="stat-v">{fmt(block)}</span>
      </div>
      <span className="stats-sep">·</span>
      <div className="stat-cluster">
        <span className="stat-k">Txs</span>
        <span className="stat-v">{fmt(tx)}</span>
      </div>
      <span className="stats-sep">·</span>
      <div className="stat-cluster">
        <span className="stat-k">Addresses</span>
        <span className="stat-v">{fmt(addr)}</span>
      </div>
      <span className="stats-sep">·</span>
      <div className="stat-cluster">
        <span className="stat-k">Chain</span>
        <span className="stat-v">589</span>
      </div>
    </div>
  );
}
