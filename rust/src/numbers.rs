/**
 * Numbers Module
 * Mathematical operations exported to WebAssembly
 */

use wasm_bindgen::prelude::*;

/// Add two numbers
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a.saturating_add(b)
}

/// Subtract two numbers
#[wasm_bindgen]
pub fn subtract(a: i32, b: i32) -> i32 {
    a.saturating_sub(b)
}

/// Multiply two numbers
#[wasm_bindgen]
pub fn multiply(a: i32, b: i32) -> i32 {
    a.saturating_mul(b)
}

/// Divide two numbers (integer division)
#[wasm_bindgen]
pub fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        return 0;
    }
    a / b
}

/// Calculate power (a^b)
#[wasm_bindgen]
pub fn power(a: i32, b: i32) -> i32 {
    if b < 0 {
        return 0;
    }
    let mut result = 1;
    for _ in 0..b {
        result = result.saturating_mul(a);
    }
    result
}

/// Calculate factorial (n!)
#[wasm_bindgen]
pub fn factorial(n: u32) -> u32 {
    if n <= 1 {
        return 1;
    }
    let mut result = 1;
    for i in 2..=n {
        result = result.saturating_mul(i);
    }
    result
}

/// Calculate Fibonacci number (nth)
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    if n <= 1 {
        return n;
    }
    let (mut a, mut b) = (0_u32, 1_u32);
    for _ in 0..n {
        (a, b) = (b, a.saturating_add(b));
    }
    a
}

/// Calculate the sum of an array
#[wasm_bindgen]
pub fn sum_array(data: &[i32]) -> i32 {
    data.iter().fold(0, |acc, &x| acc.saturating_add(x))
}

/// Calculate the average of an array
#[wasm_bindgen]
pub fn average_array(data: &[i32]) -> f64 {
    if data.is_empty() {
        return 0.0;
    }
    let sum: i32 = data.iter().fold(0, |acc, &x| acc.saturating_add(x));
    sum as f64 / data.len() as f64
}

/// Find the maximum value in an array
#[wasm_bindgen]
pub fn max_value(data: &[i32]) -> i32 {
    if data.is_empty() {
        return 0;
    }
    let mut max = data[0];
    for &value in data.iter().skip(1) {
        if value > max {
            max = value;
        }
    }
    max
}

/// Find the minimum value in an array
#[wasm_bindgen]
pub fn min_value(data: &[i32]) -> i32 {
    if data.is_empty() {
        return 0;
    }
    let mut min = data[0];
    for &value in data.iter().skip(1) {
        if value < min {
            min = value;
        }
    }
    min
}

/// Calculate the greatest common divisor (GCD)
#[wasm_bindgen]
pub fn gcd(mut a: u32, mut b: u32) -> u32 {
    while b != 0 {
        let temp = b;
        b = a % b;
        a = temp;
    }
    a
}

/// Calculate the least common multiple (LCM)
#[wasm_bindgen]
pub fn lcm(a: u32, b: u32) -> u32 {
    if a == 0 || b == 0 {
        return 0;
    }
    a / gcd(a, b) * b
}

/// Check if a number is prime
#[wasm_bindgen]
pub fn is_prime(n: u32) -> bool {
    if n <= 1 {
        return false;
    }
    if n <= 3 {
        return true;
    }
    if n % 2 == 0 || n % 3 == 0 {
        return false;
    }
    let mut i = 5;
    while i * i <= n {
        if n % i == 0 || n % (i + 2) == 0 {
            return false;
        }
        i += 6;
    }
    true
}

/// Generate a sequence of prime numbers up to n
#[wasm_bindgen]
pub fn primes_up_to(n: u32) -> Vec<u32> {
    let mut primes = Vec::new();
    for i in 2..=n {
        if is_prime(i) {
            primes.push(i);
        }
    }
    primes
}

/// Convert degrees to radians
#[wasm_bindgen]
pub fn deg_to_rad(degrees: f64) -> f64 {
    degrees * std::f64::consts::PI / 180.0
}

/// Convert radians to degrees
#[wasm_bindgen]
pub fn rad_to_deg(radians: f64) -> f64 {
    radians * 180.0 / std::f64::consts::PI
}