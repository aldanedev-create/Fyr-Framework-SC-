# Fyr Rust engine

Build with Rust installed:

```powershell
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
wasm-pack build --target web --release
```

Copy the generated `.wasm` and JavaScript loader into `dist/` or publish them as a separate npm package. The prototype already includes a dependency-free working WebAssembly module exporting `add` so the dashboard works immediately.
