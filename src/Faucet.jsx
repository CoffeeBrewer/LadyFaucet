import { useState, useMemo } from "react";
import { faucets } from "./faucets";
import TokenRow from "./TokenRow";
import "./faucet.css";

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function Faucet() {
  const [address, setAddress] = useState("");
  const isValid = /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const lady    = faucets.find((f) => f.native);
  const project = useMemo(() => shuffle(faucets.filter((f) => !f.native)), []);

  return (
    <div className="altar">
      <div className="cosmos" />

      <section className="petition">
        <label className="petition-label" htmlFor="addr">
          Your address
        </label>
        <div className="petition-input">
          <input
            id="addr"
            type="text"
            className={`addr-field ${address && !isValid ? "addr-invalid" : ""}`}
            placeholder="0x…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          <span className={`petition-status ${isValid ? "ok" : ""}`}>
            {address ? (isValid ? "valid" : "invalid") : "EVM"}
          </span>
        </div>
      </section>

      {lady && (
        <section className="lady-hero">
          <div className="lady-hero-frame">
            <img
              src="/icons/LADY.png"
              alt="$LADY"
              className="lady-hero-icon"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <div className="lady-hero-body">
              <div className="lady-hero-eyebrow">Native · Chain 589</div>
              <div className="lady-hero-title">$LADY</div>
              <div className="lady-hero-meta">LadyChain native token · 0.1 LADY per claim</div>
            </div>
            <div className="lady-hero-action">
              <TokenRow token={lady} address={address} layout="hero" />
            </div>
          </div>
        </section>
      )}

      <div className="section-head">
        <span className="section-title">Project tokens</span>
        <span className="section-count">{project.length} faucets</span>
      </div>

      <section className="offerings">
        {project.map((t) => (
          <TokenRow key={t.slug} token={t} address={address} />
        ))}
      </section>

      <footer className="altar-foot">
        Powered by <a href="https://ladyscan.us" target="_blank" rel="noreferrer">LadyChain</a> · Chain 589
      </footer>
    </div>
  );
}
