import { useMemo } from "react";
import { faucets } from "./faucets";
import FaucetRow from "./FaucetRow";

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function FaucetGrid({ address }) {
  const ordered = useMemo(() => shuffle(faucets), []);
  return (
    <section className="grid-section">
      <h2 className="grid-title">Project faucets on LadyChain</h2>
      <p className="grid-sub">
        Use the address field above and claim from any faucet in one click.
      </p>
      <div className="grid">
        {ordered.map((f) => (
          <FaucetRow key={f.slug} faucet={f} address={address} />
        ))}
      </div>
    </section>
  );
}
