#!/usr/bin/env bash
#
# create-faucet.sh — scaffold a new project faucet end-to-end.
#
# Steps 1-5 + 7 (everything except Namecheap CNAME, which is manual):
#   1. Clone SlothFaucet template → new local project dir
#   2. Rebrand strings (ticker, name, contract, drip, theme)
#   3. npm install + git init + GitHub repo + first push
#   4. Netlify site + env:import + mark FAUCET_PK secret
#   5. Append entry to LadyFaucet hub manifest + commit + push
#
# Manual step 6 (DNS + custom domain in Netlify) is printed at the end.
#
# Usage:
#   ./scripts/create-faucet.sh \
#     --slug doge --ticker DOGE --name "Dogecoin" \
#     --ca 0x... --drip 100 \
#     --accent "#f4b942" --accent2 "#d97706" \
#     [--decimals 18] [--repo dogefaucet]

set -euo pipefail

# ─── Defaults / constants ──────────────────────────────────────────────
TEMPLATE_DIR="/home/blockbrewer/projects/SlothFaucet"
PROJECTS_DIR="/home/blockbrewer/projects"
HUB_DIR="$PROJECTS_DIR/LadyFaucet"
NETLIFY_ACCOUNT_SLUG="sjoerdvdpol"
GH_OWNER="CoffeeBrewer"
DECIMALS=18

SLUG="" TICKER="" NAME="" CA="" DRIP=""
ACCENT="" ACCENT2="" REPO_NAME=""

# ─── Arg parsing ───────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --slug)     SLUG="$2"; shift 2 ;;
    --ticker)   TICKER="$2"; shift 2 ;;
    --name)     NAME="$2"; shift 2 ;;
    --ca)       CA="$2"; shift 2 ;;
    --drip)     DRIP="$2"; shift 2 ;;
    --accent)   ACCENT="$2"; shift 2 ;;
    --accent2)  ACCENT2="$2"; shift 2 ;;
    --decimals) DECIMALS="$2"; shift 2 ;;
    --repo)     REPO_NAME="$2"; shift 2 ;;
    -h|--help)  sed -n '2,21p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

die() { echo "ERROR: $*" >&2; exit 1; }

# ─── Validate ──────────────────────────────────────────────────────────
[[ -z "$SLUG" || -z "$TICKER" || -z "$NAME" || -z "$CA" || -z "$DRIP" \
   || -z "$ACCENT" || -z "$ACCENT2" ]] \
  && die "Missing required flags. Required: --slug --ticker --name --ca --drip --accent --accent2"

[[ "$SLUG" =~ ^[a-z0-9]+$ ]] || die "--slug must be lowercase alphanumeric: '$SLUG'"
[[ "$CA" =~ ^0x[a-fA-F0-9]{40}$ ]] || die "Invalid contract address: $CA"
[[ "$ACCENT"  =~ ^#[a-fA-F0-9]{6}$ ]] || die "Invalid --accent hex: $ACCENT (use #rrggbb)"
[[ "$ACCENT2" =~ ^#[a-fA-F0-9]{6}$ ]] || die "Invalid --accent2 hex: $ACCENT2"

[[ -z "$REPO_NAME" ]] && REPO_NAME="${SLUG}faucet"
SLUG_CAP="$(tr '[:lower:]' '[:upper:]' <<<"${SLUG:0:1}")${SLUG:1}"
NEW_DIR="$PROJECTS_DIR/${SLUG_CAP}Faucet"
SITE_NAME="${SLUG}-faucet"

[[ -d "$NEW_DIR" ]]      && die "Directory already exists: $NEW_DIR"
[[ -d "$TEMPLATE_DIR" ]] || die "Template not found: $TEMPLATE_DIR"
[[ -d "$HUB_DIR" ]]      || die "Hub not found: $HUB_DIR"
command -v gh   >/dev/null || die "gh CLI not installed"
command -v npx  >/dev/null || die "npx not available"
command -v python3 >/dev/null || die "python3 required (manifest insert)"
gh auth status >/dev/null 2>&1 || die "gh not authenticated. Run: gh auth login"

# Hub must be clean — script will commit+push to it
if [[ -n "$(cd "$HUB_DIR" && git status --porcelain)" ]]; then
  die "LadyFaucet has uncommitted changes. Commit or stash before running this script."
fi

# Format drip with commas if numeric and >= 1000
if [[ "$DRIP" =~ ^[0-9]+$ ]] && (( DRIP >= 1000 )); then
  DRIP_FMT="$(python3 -c "print(format(int('$DRIP'), ','))")"
else
  DRIP_FMT="$DRIP"
fi
DRIP_LABEL="${DRIP_FMT} ${TICKER}"

echo "─────────────────────────────────────────────────────────────"
echo "  ${SLUG_CAP}Faucet  •  ${TICKER}  •  drip ${DRIP_LABEL}"
echo "─────────────────────────────────────────────────────────────"
echo "  Local:     $NEW_DIR"
echo "  Repo:      https://github.com/${GH_OWNER}/${REPO_NAME}"
echo "  Site:      https://${SITE_NAME}.netlify.app"
echo "  Subdomain: https://${SLUG}.ladyfaucet.online  (manual DNS)"
echo

# ─── 1. Clone template ─────────────────────────────────────────────────
echo "==> [1/7] Cloning template"
cp -r "$TEMPLATE_DIR" "$NEW_DIR"
rm -rf "$NEW_DIR/node_modules" "$NEW_DIR/dist" "$NEW_DIR/.git" \
       "$NEW_DIR/.netlify"     "$NEW_DIR/package-lock.json"
chmod 600 "$NEW_DIR/.env"

# ─── 2. Rebrand strings ────────────────────────────────────────────────
echo "==> [2/7] Rebranding"

sed -i "s|\"name\": \"sloth-faucet\"|\"name\": \"${SLUG}-faucet\"|" \
  "$NEW_DIR/package.json"

sed -i "s|<title>.*</title>|<title>${NAME} Faucet</title>|" \
  "$NEW_DIR/index.html"

sed -i "s|^TOKEN_ADDRESS=.*|TOKEN_ADDRESS=${CA}|"      "$NEW_DIR/.env"
sed -i "s|^TOKEN_DECIMALS=.*|TOKEN_DECIMALS=${DECIMALS}|" "$NEW_DIR/.env"
sed -i "s|^DRIP_TOKENS=.*|DRIP_TOKENS=${DRIP}|"        "$NEW_DIR/.env"

sed -i "s|const DRIP_LABEL = \".*\";|const DRIP_LABEL = \"${DRIP_LABEL}\";|" \
  "$NEW_DIR/src/Faucet.jsx"
sed -i "s|<h1>Sloth Syndicate Faucet</h1>|<h1>${NAME} Faucet</h1>|" \
  "$NEW_DIR/src/Faucet.jsx"
sed -i "s|Faucet sends SLOTH token|Faucet sends ${TICKER} token|" \
  "$NEW_DIR/src/Faucet.jsx"
sed -i "s|Sending SLOTH…|Sending ${TICKER}…|" \
  "$NEW_DIR/src/Faucet.jsx"
sed -i "s|Powered by Sloth Syndicate|Powered by ${NAME}|" \
  "$NEW_DIR/src/Faucet.jsx"

sed -i "s|--accent: #ff4fa3;|--accent: ${ACCENT};|"   "$NEW_DIR/src/faucet.css"
sed -i "s|--accent-2: #ff8c2e;|--accent-2: ${ACCENT2};|" "$NEW_DIR/src/faucet.css"

# ─── 3. npm install (background) ───────────────────────────────────────
echo "==> [3/7] npm install (background)"
( cd "$NEW_DIR" && npm install >/dev/null 2>&1 ) &
NPM_PID=$!

# ─── 4. git init + GitHub repo + first push ────────────────────────────
echo "==> [4/7] git init + GitHub repo create + first push"
cd "$NEW_DIR"
git init -b main >/dev/null
git config user.name  "$(cd "$HUB_DIR" && git config user.name)"
git config user.email "$(cd "$HUB_DIR" && git config user.email)"
git remote add origin "https://github.com/${GH_OWNER}/${REPO_NAME}.git"

gh repo create "${GH_OWNER}/${REPO_NAME}" --public --description \
  "${NAME} (${TICKER}) faucet on LadyChain — drips ${DRIP_LABEL} per claim." \
  >/dev/null

git add -A
if git diff --cached --name-only | grep -qE '(^|/)\.env$'; then
  die ".env got staged — check .gitignore in template"
fi
git commit -m "Initial commit: ${NAME} faucet (${TICKER} token, ${DRIP_LABEL} drip on LadyChain)" >/dev/null
git push -u origin main >/dev/null 2>&1

wait "$NPM_PID"

# ─── 5. Netlify site + env vars + PK secret ────────────────────────────
echo "==> [5/7] Netlify site + env vars + mark PK secret"
npx --offline netlify-cli sites:create \
  --account-slug "$NETLIFY_ACCOUNT_SLUG" \
  --name "$SITE_NAME" >/dev/null

npx --offline netlify-cli env:import .env >/dev/null 2>&1

PK="$(grep '^FAUCET_PK=' .env | cut -d= -f2-)"
npx --offline netlify-cli env:set FAUCET_PK "$PK" --secret \
  --context production deploy-preview branch-deploy --force >/dev/null 2>&1
unset PK

# ─── 6. Append to hub manifest ─────────────────────────────────────────
echo "==> [6/7] Appending to hub manifest"
MANIFEST="$HUB_DIR/src/faucets.js"

python3 - "$MANIFEST" "$SLUG" "$TICKER" "$NAME" "$DRIP_FMT" "$ACCENT" "$ACCENT2" <<'PY'
import re, sys
path, slug, ticker, name, drip, accent, accent2 = sys.argv[1:8]
with open(path) as f:
    content = f.read()
entry = (
    "  {\n"
    f"    slug: \"{slug}\",\n"
    f"    ticker: \"{ticker}\",\n"
    f"    name: \"{name}\",\n"
    f"    drip: \"{drip}\",\n"
    f"    url: \"https://{slug}.ladyfaucet.online\",\n"
    f"    accent: \"{accent}\",\n"
    f"    accent2: \"{accent2}\",\n"
    "  },\n"
)
new = re.sub(r'(\n)(\];\s*)\Z', r'\1' + entry + r'\2', content, count=1)
if new == content:
    sys.exit("Could not find array terminator '];' in manifest")
with open(path, 'w') as f:
    f.write(new)
PY

cd "$HUB_DIR"
git add src/faucets.js
git commit -m "Add ${TICKER} to faucets hub" >/dev/null
git push >/dev/null 2>&1

# ─── 7. Done — print manual steps ──────────────────────────────────────
echo "==> [7/7] Done"
cat <<EOF

────────────────────────────────────────────────────────────────
  Manual steps still to do:
────────────────────────────────────────────────────────────────

  1. Namecheap → DNS for ladyfaucet.online → add CNAME:
       host:  ${SLUG}
       value: ${SITE_NAME}.netlify.app

  2. Netlify dashboard → ${SITE_NAME} → Domain management:
       Add custom domain: ${SLUG}.ladyfaucet.online

  3. (One-time per site) Enable GitHub continuous deploy:
       https://app.netlify.com/projects/${SITE_NAME}/configuration/deploys
       Link repository → ${GH_OWNER}/${REPO_NAME} → branch main

  4. Verify funding wallet has ${TICKER} balance at:
       0x966FC3c318b145349A036627E73eC43ebdB998D8

  After step 3, pushing to ${REPO_NAME} auto-deploys.
EOF
