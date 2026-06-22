import { useState, useMemo } from "react";
import { faucets } from "./faucets";
import { useBalances } from "./useBalances";
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
  const shuffled = useMemo(() => shuffle(faucets.filter((f) => !f.native)), []);

  const availability = useBalances(faucets);

  // Non-empty rows first (live + still-checking), empty rows at the bottom.
  // Each group keeps the shuffled order so position doesn't reshuffle on
  // every availability poll.
  const project = useMemo(() => {
    const live  = shuffled.filter((t) => availability[t.ticker] !== "empty");
    const empty = shuffled.filter((t) => availability[t.ticker] === "empty");
    return [...live, ...empty];
  }, [shuffled, availability]);

  return (
    <div className="altar">
      <div className="cosmos" />

      <header className="altar-intro">
        <h1 className="altar-mark">LadyChain Faucet</h1>
      </header>

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
              <div className="lady-hero-eyebrow">NATIVE · CHAIN 589</div>
              <div className="lady-hero-title">$LADY</div>
              <div className="lady-hero-meta">LadyChain's native gas &amp; reward token</div>
            </div>

            <div className="hero-address">
              <label className="hero-address-label" htmlFor="addr">Your address</label>
              <div className="hero-address-input">
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
            </div>

            <div className="lady-hero-action">
              <TokenRow
                token={lady}
                address={address}
                layout="hero"
                availability={availability[lady.ticker]}
              />
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
          <TokenRow
            key={t.slug}
            token={t}
            address={address}
            availability={availability[t.ticker]}
          />
        ))}
      </section>

      <footer className="altar-foot">
        Powered by <a href="https://ladyscan.us" target="_blank" rel="noreferrer">LadyChain</a> · Chain 589
      </footer>
    </div>
  );
}
