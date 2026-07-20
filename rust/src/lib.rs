/**
 * Fyr WebAssembly Engine
 * 
 * This library provides WebAssembly exports for Fyr framework.
 * Functions are compiled to WASM and loaded by the browser.
 */

mod engine;

// Rich string, array, and memory helpers use wasm-bindgen JavaScript types and
// are intentionally opt-in. The default engine remains directly instantiable by
// Fyr's generic WebAssembly loader without generated JavaScript glue.
#[cfg(feature = "bindings")]
pub mod strings;
#[cfg(feature = "bindings")]
pub mod arrays;
#[cfg(feature = "bindings")]
pub mod memory;
#[cfg(feature = "bindings")]
pub use arrays::*;
#[cfg(feature = "bindings")]
pub use memory::*;
#[cfg(feature = "bindings")]
pub use strings::*;

#[cfg(feature = "bindings")]
pub mod numbers;
#[cfg(feature = "bindings")]
pub use numbers::*;

/// Numeric engine version for direct WebAssembly consumers.
#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn version() -> u32 {
    1
}

/// Simple test function - returns 42
#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn answer_to_life() -> u32 {
    42
}

#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn add(a: i32, b: i32) -> i32 { engine::add(a, b) }

#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn subtract(a: i32, b: i32) -> i32 { engine::subtract(a, b) }

#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn multiply(a: i32, b: i32) -> i32 { engine::multiply(a, b) }

#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn divide(a: i32, b: i32) -> i32 { engine::divide(a, b) }

#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn power(a: i32, b: i32) -> i32 { engine::power(a, b) }

#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn factorial(n: u32) -> u32 { engine::factorial(n) }

#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn fibonacci(n: u32) -> u32 { engine::fibonacci(n) }

#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn gcd(a: u32, b: u32) -> u32 { engine::gcd(a, b) }

#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn lcm(a: u32, b: u32) -> u32 { engine::lcm(a, b) }

#[cfg(not(feature = "bindings"))]
#[unsafe(no_mangle)]
pub extern "C" fn is_prime(n: u32) -> u32 { engine::is_prime(n) as u32 }
