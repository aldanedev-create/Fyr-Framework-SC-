/**
 * Fyr WebAssembly Engine
 * 
 * This library provides WebAssembly exports for Fyr framework.
 * Functions are compiled to WASM and loaded by the browser.
 */

use wasm_bindgen::prelude::*;
use console_error_panic_hook::set_once as set_panic_hook;

// Module exports
pub mod numbers;
pub mod strings;
pub mod arrays;
pub mod memory;

// Re-export all modules
pub use numbers::*;
pub use strings::*;
pub use arrays::*;
pub use memory::*;

/// Initialize the WASM module
/// Call this once when the module loads
#[wasm_bindgen]
pub fn init() {
    // Set up panic hook for better error messages
    set_panic_hook();

    // Initialize memory
    memory::init_memory();

    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Get the version of the WASM engine
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Get the engine name
#[wasm_bindgen]
pub fn engine_name() -> String {
    "Fyr WASM Engine".to_string()
}

/// Simple test function - returns 42
#[wasm_bindgen]
pub fn answer_to_life() -> u32 {
    42
}

/// Echo a string back
#[wasm_bindgen]
pub fn echo_string(input: String) -> String {
    input
}

/// Measure execution time of a function (for benchmarking)
#[wasm_bindgen]
pub fn measure_time(fn_name: String) -> String {
    format!("Measured: {}", fn_name)
}