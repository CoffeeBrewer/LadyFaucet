import { useState } from "react";

const ICONS = {
  website: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  ),
};

function Socials({ token }) {
  const links = [
    token.website  && { href: token.website,  label: "Website",  icon: ICONS.website  },
    token.twitter  && { href: token.twitter,  label: "X",        icon: ICONS.twitter  },
    token.telegram && { href: token.telegram, label: "Telegram", icon: ICONS.telegram },
    token.discord  && { href: token.discord,  label: "Discord",  icon: ICONS.discord  },
  ].filter(Boolean);
  if (!links.length) return null;
  return (
    <span className="offering-socials">
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
           className="social-link" title={l.label} aria-label={l.label}
           onClick={(e) => e.stopPropagation()}>
          {l.icon}
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
          <a href={`https://ladyscan.us/tx/${txHash}`} target="_blank" rel="noreferrer" className="hero-status-link">
            view tx →
          </a>
        )}
        {status === "error" && (
          <div className="hero-status-err">{message}</div>
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
        <span className="offering-name">{token.name}</span>
        <span className="offering-ticker">· {token.ticker}</span>
        <Socials token={token} />
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
        {status === "success" && txHash && (
          <a href={`https://ladyscan.us/tx/${txHash}`} target="_blank" rel="noreferrer" className="action-status-link">
            view tx →
          </a>
        )}
        {status === "error" && (
          <span className="action-status-err">{message}</span>
        )}
      </div>
    </div>
  );
}
