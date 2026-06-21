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
      <div className="cosmos">
        <div className="orb orb-pink" />
        <div className="orb orb-purple" />
        <div className="orb orb-teal" />
        <div className="starfield" />
      </div>

      <section className="petition">
        <label className="petition-label" htmlFor="addr">
          Bless this address with…
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
            {address ? (isValid ? "✓ valid" : "✗ invalid") : "EVM"}
          </span>
        </div>
        <p className="petition-hint">
          One blessing per address, per offering.
        </p>
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
              <div className="lady-hero-eyebrow">Native to LadyChain</div>
              <h1 className="lady-hero-title">$LADY</h1>
              <div className="lady-hero-drip">
                <span className="lady-hero-amount">0.1</span>
                <span className="lady-hero-unit">LADY</span>
              </div>
            </div>
            <div className="lady-hero-action">
              <TokenRow token={lady} address={address} layout="hero" />
            </div>
          </div>
        </section>
      )}

      <div className="offering-divider">
        <span className="divider-line" />
        <span className="divider-mark">Project offerings</span>
        <span className="divider-line" />
      </div>

      <section className="offerings">
        {project.map((t) => (
          <TokenRow key={t.slug} token={t} address={address} />
        ))}
      </section>

      <footer className="altar-foot">
        <span>⚜</span>
        <span>Powered by LadyChain · Chain 589</span>
        <span>⚜</span>
      </footer>
    </div>
  );
}
