// Token manifest for the central hub faucet function.
// Add a new token by adding a row here. Native LADY uses { native: true }.

export const TOKENS = {
  LADY:    { native: true,                                                                  decimals: 18, drip: "0.1" },

  SLOTH:   { contract: "0xa1c994969cd91bcb6f6b3d3b39ab3353ef41a735", decimals: 18, drip: "1000" },
  WISDOG:  { contract: "0x4c8defb1a01ba164d2a927e57c981925a921d3cc", decimals: 18, drip: "87150" },
  BITCOIN: { contract: "0x83326cfd657760197794908023abc54db514822b", decimals: 18, drip: "5" },
  BEANS:   { contract: "0x6f04b7d69f19a7da5285d3f36c34a31eda14589c", decimals: 18, drip: "1000" },
  BOO:     { contract: "0xb3f7e88dc78eee09e1fc664a3c7b1bbf0a8a12ff", decimals: 18, drip: "0.00001" },
  BC:      { contract: "0x068cb875c560b2f96bbb55b9ca87739943b576a7", decimals:  9, drip: "0.71" },
  LMAX:    { contract: "0x863749bbd57a2e675208d88c243fb63730428d64", decimals: 18, drip: "250" },
  CAFE:    { contract: "0x9acced798339ad12e58e5dc41989102a19db325c", decimals: 18, drip: "50000000" },
  L589:    { contract: "0x95a1219c5d0f4e81babe07f101f84d013b06a6b8", decimals: 18, drip: "100" },
  GIGA:    { contract: "0x932083ceab6f0a40e89d0ff753e45f033a783faa", decimals: 18, drip: "10" },
  CBM:     { contract: "0x7c4c48dc349ce192f96f62244dbc42ffaf116ce7", decimals: 18, drip: "100" },
};
