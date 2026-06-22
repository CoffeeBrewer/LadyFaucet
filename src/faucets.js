// Frontend token manifest.
// `contract` + `decimals` mirror the backend (netlify/functions/_tokens.js)
// so the UI can do balance checks against the funding wallet without
// an extra round-trip through the function.

export const FUNDING_WALLET = "0x8e1B10b7A34aA4D7535c9435bBa963FFB2F34553";

export const faucets = [
  {
    slug: "lady",
    ticker: "LADY",
    name: "LadyChain",
    drip: "0.1",
    decimals: 18,
    url: "https://ladyfaucet.online",
    native: true,
    accent: "#e8459e",
    accent2: "#3d1240",
  },
  // socials sourced from LadyCharts token_metadata table (June 2026)
  { slug: "sloth",   ticker: "SLOTH",   name: "Sloth Syndicate",     drip: "1,000",
    contract: "0xa1c994969cd91bcb6f6b3d3b39ab3353ef41a735", decimals: 18,
    twitter: "https://x.com/jojovibes24" },
  { slug: "wisdog",  ticker: "WISDOG",  name: "Dog of Wisdom",       drip: "87,150",
    contract: "0x4c8defb1a01ba164d2a927e57c981925a921d3cc", decimals: 18 },
  { slug: "bitcoin", ticker: "BITCOIN", name: "Magic Internet Money", drip: "5",
    contract: "0x83326cfd657760197794908023abc54db514822b", decimals: 18 },
  { slug: "beans",   ticker: "BEANS",   name: "Coffeebeans",         drip: "1,000",
    contract: "0x6f04b7d69f19a7da5285d3f36c34a31eda14589c", decimals: 18,
    telegram: "https://t.me/CoffeeholicsMetaCafe" },
  { slug: "boo",     ticker: "BOO",     name: "BOO",                 drip: "0.00001",
    contract: "0xb3f7e88dc78eee09e1fc664a3c7b1bbf0a8a12ff", decimals: 18,
    twitter: "https://x.com/booxrpl?s=11" },
  { slug: "bullishclick", ticker: "BC", name: "Bullish Click",       drip: "0.71",
    contract: "0x068cb875c560b2f96bbb55b9ca87739943b576a7", decimals:  9 },
  { slug: "lmax",    ticker: "LMAX",    name: "Ladyus Maximus",      drip: "250",
    contract: "0x863749bbd57a2e675208d88c243fb63730428d64", decimals: 18,
    telegram: "https://t.me/+XBadV0smnlphMDA0" },
  { slug: "cafe",    ticker: "CAFE",    name: "CAFE DOLLARS",        drip: "50,000,000",
    contract: "0x9acced798339ad12e58e5dc41989102a19db325c", decimals: 18 },
  { slug: "l589",    ticker: "L589",    name: "Lady589",             drip: "100",
    contract: "0x95a1219c5d0f4e81babe07f101f84d013b06a6b8", decimals: 18,
    telegram: "https://t.me/+2bfm7fjD0Eo4NWQ8" },
  { slug: "giga",    ticker: "GIGA",    name: "GIGACHAD",            drip: "10",
    contract: "0x932083ceab6f0a40e89d0ff753e45f033a783faa", decimals: 18,
    website: "https://gigaonxrp.com/",
    twitter: "https://x.com/XRPLGigaChad",
    telegram: "https://t.me/gigaonx" },
  { slug: "cbm",     ticker: "CBM",     name: "Cheese Burger Money", drip: "100",
    contract: "0x7c4c48dc349ce192f96f62244dbc42ffaf116ce7", decimals: 18 },
];
