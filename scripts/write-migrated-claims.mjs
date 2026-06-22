#!/usr/bin/env node
// Writes pre-existing claims into the `hub-claims` Netlify Blob store so
// addresses that already drained the old funding wallet can't double-dip
// through the new hub.
//
// Reads /tmp/claims-to-migrate.json produced by scan-old-claims.mjs.
// Idempotent: re-running is safe (writes the same keys).

import { getStore } from "@netlify/blobs";
import fs from "fs";
import os from "os";
import path from "path";

const SITE_ID = JSON.parse(
  fs.readFileSync(".netlify/state.json", "utf8")
).siteId;

const TOKEN = (() => {
  const cfg = JSON.parse(
    fs.readFileSync(
      path.join(os.homedir(), ".config/netlify/config.json"),
      "utf8"
    )
  );
  const user = Object.values(cfg.users)[0];
  return user.auth.token;
})();

const data = JSON.parse(fs.readFileSync("/tmp/claims-to-migrate.json", "utf8"));

const store = getStore({
  name: "hub-claims",
  siteID: SITE_ID,
  token: TOKEN,
});

const total = Object.values(data).reduce((a, v) => a + v.length, 0);
console.log(`Writing ${total} claim records to hub-claims …`);

let done = 0;
const t0 = Date.now();
for (const [ticker, addresses] of Object.entries(data)) {
  for (const addr of addresses) {
    const key = `claimed:${ticker}:${addr.toLowerCase()}`;
    await store.setJSON(key, { ts: 0, migrated: true });
    done++;
    if (done % 50 === 0) {
      const rate = (done / ((Date.now() - t0) / 1000)).toFixed(1);
      process.stdout.write(`  ${done}/${total}  (${rate}/s)\n`);
    }
  }
}
console.log(`Done. ${done} entries written in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
