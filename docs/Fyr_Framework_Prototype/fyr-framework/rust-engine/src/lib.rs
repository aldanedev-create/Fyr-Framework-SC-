use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(left: i32, right: i32) -> i32 {
    left.saturating_add(right)
}

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    let (mut a, mut b) = (0_u32, 1_u32);
    for _ in 0..n {
        (a, b) = (b, a.saturating_add(b));
    }
    a
}
