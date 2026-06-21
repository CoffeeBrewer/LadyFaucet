import { useState } from "react";

export default function TokenRow({ token, address }) {
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
      const res = await fetch(`/.netlify/functions/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), token: token.ticker })
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
      className={`offering offering-${status} ${token.native ? "offering-native" : ""}`}
      style={{ "--c1": token.accent, "--c2": token.accent2 }}
    >
      <div className="offering-sigil">
        <span className="sigil-letter">{token.ticker[0]}</span>
        <span className="sigil-ring" />
      </div>

      <div className="offering-meta">
        <div className="offering-ticker">
          {token.ticker}
          {token.native && <span className="offering-pill">native</span>}
        </div>
        <div className="offering-name">{token.name}</div>
      </div>

      <div className="offering-drip">
        <div className="drip-amount">{token.drip}</div>
        <div className="drip-unit">{token.ticker}</div>
      </div>

      <div className="offering-action">
        <button
          className="receive-btn"
          onClick={claim}
          disabled={!isValid || status === "loading" || status === "success"}
          title={!isValid ? "Bless an address first" : ""}
        >
          {status === "loading" && (<><span className="rune-spin" /> Receiving</>)}
          {status === "idle"    && "Receive"}
          {status === "success" && "✦ Blessed"}
          {status === "error"   && "Try again"}
        </button>
      </div>

      {status === "success" && txHash && (
        <div className="offering-receipt">
          ✦ The Lady has blessed you ·{" "}
          <a href={`https://ladyscan.us/tx/${txHash}`} target="_blank" rel="noreferrer">
            view rite
          </a>
        </div>
      )}
      {status === "error" && (
        <div className="offering-receipt err">✗ {message}</div>
      )}
    </div>
  );
}
