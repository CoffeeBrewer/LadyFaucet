import { faucets } from "./faucets";

export default function FaucetGrid() {
  return (
    <section className="grid-section">
      <h2 className="grid-title">Project faucets on LadyChain</h2>
      <div className="grid">
        {faucets.map((f) => (
          <a
            key={f.slug}
            className="mini-card"
            href={f.url}
            target="_blank"
            rel="noreferrer"
            style={{ "--card-accent": f.accent, "--card-accent-2": f.accent2 }}
          >
            <div className="mini-ticker">{f.ticker}</div>
            <div className="mini-name">{f.name}</div>
            <div className="mini-meta">
              <span className="mini-label">Drip</span>
              <span className="mini-drip">{f.drip}</span>
            </div>
            <div className="mini-link">Visit →</div>
          </a>
        ))}
      </div>
    </section>
  );
}
