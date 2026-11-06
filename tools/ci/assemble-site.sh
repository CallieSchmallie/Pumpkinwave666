#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
# Assemble the GitHub Pages flasher site.
#   tools/ci/assemble-site.sh <dist with preview/ and optional firmware/> <out>
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
dist="$1"; out="$2"
rm -rf "$out"; mkdir -p "$out/downloads" "$out/screens"
cp "$root/site/index.html" "$out/index.html"
cp "$dist/preview/index.html" "$out/preview.html"
cp "$root"/presets/*.syx "$root/presets/PRESETS.txt" "$out/downloads/"
cp "$root"/docs/screenshots/*.png "$out/screens/"
touch "$out/.nojekyll"
flasher=false; fw_sha=""
workbench="$(find "$dist" -name 'FM1-Official-Open-Source.html' 2>/dev/null | head -1 || true)"
fwsc="$(find "$dist" -name 'FM1_OFFICIAL_OPEN.fwsc' 2>/dev/null | head -1 || true)"
if [ -n "$workbench" ] && [ -n "$fwsc" ]; then
  cp "$workbench" "$out/flasher.html"
  cp "$fwsc" "$out/downloads/PumpkinWave666.fwsc"
  fw_sha="$(sha256sum "$fwsc" | cut -d' ' -f1)"
  flasher=true
fi
( cd "$out" && sha256sum preview.html downloads/* $( $flasher && echo flasher.html ) > SHA256SUMS.txt )
cat > "$out/build.json" <<EOF
{"flasher": $flasher, "firmware_sha256": "$fw_sha", "commit": "${GIT_SHA:-local}", "repo": "${REPO:-}", "built": "$(date -u +%Y-%m-%dT%H:%MZ)"}
EOF
echo "Site in $out (flasher: $flasher)"
