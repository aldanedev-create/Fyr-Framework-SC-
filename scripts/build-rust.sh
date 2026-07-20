#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
manifest_path="$project_root/rust/Cargo.toml"
release_artifact="$project_root/rust/target/wasm32-unknown-unknown/release/fyr_engine.wasm"
dist_directory="$project_root/dist"
dist_artifact="$dist_directory/fyr-engine.wasm"

cargo build --manifest-path "$manifest_path" --target wasm32-unknown-unknown --release
test -f "$release_artifact"
mkdir -p "$dist_directory"
cp "$release_artifact" "$dist_artifact"
printf 'Copied %s to %s\n' "$release_artifact" "$dist_artifact"
