import { getStore } from "@netlify/blobs";
import fs from "fs"; import os from "os"; import path from "path";

const SITE_ID = JSON.parse(fs.readFileSync(".netlify/state.json","utf8")).siteId;
const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(),".config/netlify/config.json"),"utf8"));
const TOKEN = Object.values(cfg.users)[0].auth.token;

const store = getStore({ name: "hub-claims", siteID: SITE_ID, token: TOKEN });
const data = JSON.parse(fs.readFileSync("/tmp/claims-to-migrate.json","utf8"));

let hits=0, misses=0;
for (const [tk, addrs] of Object.entries(data)) {
  const sample = addrs.slice(0, 2);
  for (const a of sample) {
    const k = `claimed:${tk}:${a.toLowerCase()}`;
    const v = await store.get(k);
    if (v) hits++; else { misses++; console.log("MISS", k); }
  }
}
console.log(`spot-check: hits=${hits} misses=${misses}`);
