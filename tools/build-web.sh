#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
# Linux/macOS port of tools/Build-Web.ps1 -LocalPreview.
# Builds the browser simulator (build/web/simulator.wasm) and a single-file
# preview (build/preview/index.html). Needs WASI SDK 27 and Node 18+.
#   FM1_WASI_SDK=/path/to/wasi-sdk-27.0-x86_64-linux ./tools/build-web.sh
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
sdk="${FM1_WASI_SDK:-}"
[ -n "$sdk" ] && [ -x "$sdk/bin/clang" ] || { echo "Set FM1_WASI_SDK to an extracted WASI SDK 27" >&2; exit 2; }
mkdir -p "$root/build/web" "$root/build/preview"
sources=()
while IFS= read -r f; do sources+=("$f"); done < <(
  cd "$root" && find app web third_party/synth -type f -name '*.c' ! -path 'app/board/*' | LC_ALL=C sort)
inc=()
for d in web/engine web/synth third_party/synth sdk/include app/synth app; do inc+=("-I$root/$d"); done
abs=(); for s in "${sources[@]}"; do abs+=("$root/$s"); done
echo "Compile the browser application (${#sources[@]} files)"
"$sdk/bin/clang" --sysroot="$sdk/share/wasi-sysroot" -std=c11 -O2 -fwrapv -fno-fast-math -ffp-contract=off \
  -DFM1_HOST_TEST -DFM1_OPEN_WEB -Wall -Wextra -Werror -Wno-unused-function -Wno-array-parameter \
  -mexec-model=reactor "${inc[@]}" "${abs[@]}" \
  -Wl,--strip-all -Wl,-z,stack-size=131072 -Wl,--initial-memory=4194304 -Wl,--max-memory=33554432 \
  -o "$root/build/web/simulator.wasm"
node "$root/tools/assemble-preview.mjs" "$root"
node "$root/tools/theme-workbench.mjs" "$root/build/preview/index.html"
