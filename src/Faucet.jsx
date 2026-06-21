import { useState, useMemo } from "react";
import { faucets } from "./faucets";
import StatsBar from "./StatsBar";
import TokenRow from "./TokenRow";
import "./faucet.css";

// Fisher-Yates shuffle for the project tokens (LADY stays at the top)
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

  // LADY always first, the rest shuffled per page load
  const ordered = useMemo(() => {
    const lady    = faucets.find((f) => f.native);
    const rest    = faucets.filter((f) => !f.native);
    return lady ? [lady, ...shuffle(rest)] : shuffle(faucets);
  }, []);

  return (
    <div className="altar">
      <div className="cosmos">
        <div className="orb orb-pink" />
        <div className="orb orb-purple" />
        <div className="orb orb-teal" />
        <div className="starfield" />
      </div>

      <header className="altar-head">
        <StatsBar />

        <div className="altar-crest" aria-hidden="true">
          <span className="crest-flourish left">❦</span>
          <span className="crest-symbol">⚜</span>
          <span className="crest-flourish right">❦</span>
        </div>

        <h1 className="altar-title">$LADY</h1>
        <p className="altar-sub">The Altar of LadyChain</p>
      </header>

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

      <div className="offering-divider">
        <span className="divider-line" />
        <span className="divider-mark">The Lady's Offerings</span>
        <span className="divider-line" />
      </div>

      <section className="offerings">
        {ordered.map((t) => (
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
