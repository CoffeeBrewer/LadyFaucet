import { useState } from "react";

export default function FaucetRow({ faucet, address }) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  const isValid = /^0x[a-fA-F0-9]{40}$/.test((address || "").trim());

  async function claim() {
    if (!isValid) return;
    try {
      setStatus("loading");
      setMessage("");
      setTxHash("");
      const res = await fetch(`${faucet.url}/.netlify/functions/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Failed (${res.status})`);
      }
      setTxHash(data.txHash);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setMessage(e.message || "Failed");
    }
  }

  return (
    <div
      className="mini-card"
      style={{ "--card-accent": faucet.accent, "--card-accent-2": faucet.accent2 }}
    >
      <div className="mini-ticker">{faucet.ticker}</div>
      <div className="mini-name">{faucet.name}</div>
      <div className="mini-meta">
        <span className="mini-drip">Get {faucet.drip} tokens</span>
      </div>

      <button
        className="mini-claim"
        onClick={claim}
        disabled={!isValid || status === "loading"}
        title={!isValid ? "Enter your EVM address in the field above" : ""}
      >
        {status === "loading" ? (
          <>
            <span className="spinner" /> Claiming…
          </>
        ) : (
          "Claim"
        )}
      </button>

      {status === "success" && (
        <div className="mini-status mini-success">
          ✓ Sent{" "}
          {txHash && (
            <a
              href={`https://ladyscan.us/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              view tx
            </a>
          )}
        </div>
      )}
      {status === "error" && (
        <div className="mini-status mini-error">✗ {message}</div>
      )}

      <a
        className="mini-link"
        href={faucet.url}
        target="_blank"
        rel="noreferrer"
      >
        Visit →
      </a>
    </div>
  );
}
