import { useMemo, useState } from "react";
import { ethers } from "ethers";
import "./faucet.css";

const FAUCET_ADDRESS = "0xD0e6e232e2D17fEC473C171663368d47e0aC77f8";
const CHAIN_ID = 589;

// Minimal ABI voor claim
const FAUCET_ABI = [
  "function claim(bytes32 nonce, bytes sig) external"
];

export default function Faucet() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("idle"); 
  // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  const isValidEvm = useMemo(
    () => /^0x[a-fA-F0-9]{40}$/.test(address.trim()),
    [address]
  );

  async function requestTokens() {
    if (!isValidEvm) {
      setStatus("error");
      setMessage("Please enter a valid EVM address.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");
      setTxHash("");

      // 1) Call Netlify function → nonce + sig
      const res = await fetch("/.netlify/functions/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setStatus("error");
        setMessage(data?.error || "Claim denied.");
        return;
      }

      const { nonce, sig } = data;

      // 2) On-chain claim via wallet
      if (!window.ethereum) {
        setStatus("error");
        setMessage("No wallet found. Install MetaMask.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== CHAIN_ID) {
        setStatus("error");
        setMessage(`Please switch to LadyChain (chainId ${CHAIN_ID}).`);
        return;
      }

      const signer = await provider.getSigner();
      const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, signer);

      const tx = await faucet.claim(nonce, sig);
      setTxHash(tx.hash);

      await tx.wait();

      setStatus("success");
      setMessage("0.1 $LADY has been sent to your address!");
    } catch (e) {
      console.error(e);
      setStatus("error");
      setMessage(e?.shortMessage || e?.message || "Something went wrong.");
    }
  }

  return (
    <div className="page">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />

      <main className="container">
        <header className="header">
          <div className="badge">Faucet</div>
          <h1>LadyChain Faucet</h1>
          <p className="sub">
            Enter your EVM address and receive <b>0.1 LADY</b> (native).  
            Enough for gas fees to get started.
          </p>
        </header>

        <section className="card">
          <label className="label" htmlFor="addr">Your EVM Address</label>

          <div className="input-row">
            <input
              id="addr"
              className={`input ${address && !isValidEvm ? "input-error" : ""}`}
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="off"
              spellCheck="false"
            />
            <div className={`pill ${isValidEvm ? "pill-ok" : "pill-warn"}`}>
              {address ? (isValidEvm ? "Valid" : "Invalid") : "EVM"}
            </div>
          </div>

          <p className="helper">
            Please use a LadyChain-compatible EVM address.
          </p>

          <button
            className="btn"
            onClick={requestTokens}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <span className="spinner" />
                Sending…
              </>
            ) : (
              "Request 0.1 LADY"
            )}
          </button>

          <div className="info">
            <div className="info-item">
              <span className="dot" /> You will receive exactly <b>0.1 LADY</b>.
            </div>
            <div className="info-item">
              <span className="dot" /> One request per address.
            </div>
          </div>

          {status === "success" && (
            <div className="alert success">
              <b>Success!</b> {message}

              {txHash && (
                <div className="tx">
                  Tx: <code>{txHash}</code>
                  <a
                    href={`https://explorer.ladychain.xyz/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on Explorer →
                  </a>
                </div>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="alert error">
              <b>Error:</b> {message}
            </div>
          )}
        </section>

        <footer className="footer">
          Powered by LadyChain • Faucet sends 0.1 LADY per request
        </footer>
      </main>
    </div>
  );
}
