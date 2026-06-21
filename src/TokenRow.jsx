import { useState } from "react";

function Socials({ token }) {
  const links = [
    token.website  && { href: token.website,  label: "Website",  glyph: "↗" },
    token.twitter  && { href: token.twitter,  label: "X",        glyph: "𝕏" },
    token.telegram && { href: token.telegram, label: "Telegram", glyph: "✈" },
    token.discord  && { href: token.discord,  label: "Discord",  glyph: "◆" },
  ].filter(Boolean);
  if (!links.length) return null;
  return (
    <span className="offering-socials">
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
           className="social-link" title={l.label} onClick={(e) => e.stopPropagation()}>
          {l.glyph}
        </a>
      ))}
    </span>
  );
}

export default function TokenRow({ token, address, layout }) {
  const [status, setStatus]   = useState("idle");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash]   = useState("");
  const [iconFailed, setIconFailed] = useState(false);

  const isValid = /^0x[a-fA-F0-9]{40}$/.test((address || "").trim());
  const hero    = layout === "hero";

  async function claim() {
    if (!isValid) return;
    try {
      setStatus("loading"); setMessage(""); setTxHash("");
      const res = await fetch(`/.netlify/functions/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), token: token.ticker })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `Failed (${res.status})`);
      setTxHash(data.txHash);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setMessage(e.message || "Failed");
    }
  }

  const btnLabel = () => {
    if (status === "loading") return (<><span className="rune-spin" /> Claiming…</>);
    if (status === "success") return "✓ Sent";
    if (status === "error")   return "Try again";
    return `Claim ${token.drip} ${token.ticker}`;
  };

  if (hero) {
    return (
      <>
        <button
          className={`receive-btn hero ${status === "success" ? "success" : ""} ${status === "error" ? "error" : ""}`}
          onClick={claim}
          disabled={!isValid || status === "loading" || status === "success"}
          title={!isValid ? "Enter your EVM address above" : ""}
        >
          {btnLabel()}
        </button>
        {status === "success" && txHash && (
          <div className="hero-receipt">
            The Lady has blessed you ·{" "}
            <a href={`https://ladyscan.us/tx/${txHash}`} target="_blank" rel="noreferrer">
              view tx
            </a>
          </div>
        )}
        {status === "error" && (
          <div className="hero-receipt err">{message}</div>
        )}
      </>
    );
  }

  return (
    <div className="offering">
      <div className="offering-sigil">
        {!iconFailed ? (
          <img
            src={`/icons/${token.ticker}.png`}
            alt=""
            className="sigil-img"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <span className="sigil-letter">{token.ticker[0]}</span>
        )}
      </div>

      <div className="offering-meta">
        <div className="offering-name">{token.name}</div>
        <div className="offering-sub">
          <span className="offering-drip-inline">{token.drip} {token.ticker}</span>
          <Socials token={token} />
        </div>
      </div>

      <div className="offering-action">
        <button
          className={`receive-btn ${status === "success" ? "success" : ""} ${status === "error" ? "error" : ""}`}
          onClick={claim}
          disabled={!isValid || status === "loading" || status === "success"}
          title={!isValid ? "Enter your EVM address above" : ""}
        >
          {btnLabel()}
        </button>
      </div>

      {status === "success" && txHash && (
        <div className="offering-receipt">
          The Lady has blessed you ·{" "}
          <a href={`https://ladyscan.us/tx/${txHash}`} target="_blank" rel="noreferrer">
            view tx
          </a>
        </div>
      )}
      {status === "error" && (
        <div className="offering-receipt err">{message}</div>
      )}
    </div>
  );
}
