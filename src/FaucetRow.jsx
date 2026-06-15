export default function FaucetRow({ faucet }) {
  return (
    <div
      className="mini-card mini-card-disabled"
      style={{ "--card-accent": faucet.accent, "--card-accent-2": faucet.accent2 }}
    >
      <div className="mini-ticker">{faucet.ticker}</div>
      <div className="mini-name">{faucet.name}</div>
      <div className="mini-meta">
        <span className="mini-drip">Get {faucet.drip} tokens</span>
      </div>

      <button className="mini-claim" disabled title="Faucets temporarily offline">
        Offline
      </button>
    </div>
  );
}
