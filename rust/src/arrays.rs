/**
 * Arrays Module
 * Array operations exported to WebAssembly
 */

use wasm_bindgen::prelude::*;

/// Sort an array of numbers (ascending)
#[wasm_bindgen]
pub fn sort_numbers(data: &mut [i32]) -> Vec<i32> {
    let mut sorted = data.to_vec();
    sorted.sort();
    sorted
}

/// Sort an array of numbers (descending)
#[wasm_bindgen]
pub fn sort_numbers_desc(data: &mut [i32]) -> Vec<i32> {
    let mut sorted = data.to_vec();
    sorted.sort_by(|a, b| b.cmp(a));
    sorted
}

/// Filter numbers greater than a threshold
#[wasm_bindgen]
pub fn filter_greater_than(data: &[i32], threshold: i32) -> Vec<i32> {
    data.iter().filter(|&&x| x > threshold).copied().collect()
}

/// Filter numbers less than a threshold
#[wasm_bindgen]
pub fn filter_less_than(data: &[i32], threshold: i32) -> Vec<i32> {
    data.iter().filter(|&&x| x < threshold).copied().collect()
}

/// Map numbers (multiply each by a factor)
#[wasm_bindgen]
pub fn map_multiply(data: &[i32], factor: i32) -> Vec<i32> {
    data.iter().map(|&x| x.saturating_mul(factor)).collect()
}

/// Map numbers (add a value to each)
#[wasm_bindgen]
pub fn map_add(data: &[i32], add: i32) -> Vec<i32> {
    data.iter().map(|&x| x.saturating_add(add)).collect()
}

/// Calculate sum of squares
#[wasm_bindgen]
pub fn sum_of_squares(data: &[i32]) -> i32 {
    data.iter().map(|&x| x.saturating_mul(x)).fold(0, |acc, x| acc.saturating_add(x))
}

/// Calculate standard deviation
#[wasm_bindgen]
pub fn standard_deviation(data: &[i32]) -> f64 {
    if data.is_empty() {
        return 0.0;
    }
    let avg = average_array(data);
    let variance: f64 = data
        .iter()
        .map(|&x| (x as f64 - avg).powi(2))
        .sum::<f64>() / data.len() as f64;
    variance.sqrt()
}

/// Calculate median
#[wasm_bindgen]
pub fn median(data: &mut [i32]) -> f64 {
    if data.is_empty() {
        return 0.0;
    }
    data.sort();
    let len = data.len();
    if len % 2 == 1 {
        data[len / 2] as f64
    } else {
        (data[len / 2 - 1] + data[len / 2]) as f64 / 2.0
    }
}

/// Calculate mode (most frequent value)
#[wasm_bindgen]
pub fn mode(data: &[i32]) -> i32 {
    if data.is_empty() {
        return 0;
    }
    use std::collections::HashMap;
    let mut counts = HashMap::new();
    for &value in data {
        *counts.entry(value).or_insert(0) += 1;
    }
    let mut max_count = 0;
    let mut mode_value = 0;
    for (&value, &count) in counts.iter() {
        if count > max_count || (count == max_count && value < mode_value) {
            max_count = count;
            mode_value = value;
        }
    }
    mode_value
}

/// Calculate range (max - min)
#[wasm_bindgen]
pub fn range(data: &[i32]) -> i32 {
    if data.is_empty() {
        return 0;
    }
    let mut min = data[0];
    let mut max = data[0];
    for &value in data.iter().skip(1) {
        if value < min {
            min = value;
        }
        if value > max {
            max = value;
        }
    }
    max - min
}

/// Remove duplicates from an array
#[wasm_bindgen]
pub fn unique(data: &[i32]) -> Vec<i32> {
    use std::collections::HashSet;
    let mut seen = HashSet::new();
    let mut result = Vec::new();
    for &value in data {
        if seen.insert(value) {
            result.push(value);
        }
    }
    result
}

/// Reverse an array
#[wasm_bindgen]
pub fn reverse_array(data: &[i32]) -> Vec<i32> {
    let mut result = data.to_vec();
    result.reverse();
    result
}

/// Rotate array left by n positions
#[wasm_bindgen]
pub fn rotate_left(data: &[i32], n: usize) -> Vec<i32> {
    if data.is_empty() || n % data.len() == 0 {
        return data.to_vec();
    }
    let len = data.len();
    let shift = n % len;
    let mut result = data.to_vec();
    result.rotate_left(shift);
    result
}

/// Rotate array right by n positions
#[wasm_bindgen]
pub fn rotate_right(data: &[i32], n: usize) -> Vec<i32> {
    if data.is_empty() || n % data.len() == 0 {
        return data.to_vec();
    }
    let len = data.len();
    let shift = n % len;
    let mut result = data.to_vec();
    result.rotate_right(shift);
    result
}

/// Calculate dot product of two arrays
#[wasm_bindgen]
pub fn dot_product(a: &[i32], b: &[i32]) -> i32 {
    let len = a.len().min(b.len());
    let mut result = 0;
    for i in 0..len {
        result = result.saturating_add(a[i].saturating_mul(b[i]));
    }
    result
}

/// Calculate Euclidean distance between two arrays
#[wasm_bindgen]
pub fn euclidean_distance(a: &[i32], b: &[i32]) -> f64 {
    let len = a.len().min(b.len());
    if len == 0 {
        return 0.0;
    }
    let sum: i32 = (0..len)
        .map(|i| (a[i] - b[i]).pow(2))
        .fold(0, |acc, x| acc.saturating_add(x));
    (sum as f64).sqrt()
}

/// Zip two arrays into pairs
#[wasm_bindgen]
pub fn zip_arrays(a: &[i32], b: &[i32]) -> Vec<(i32, i32)> {
    let len = a.len().min(b.len());
    let mut result = Vec::with_capacity(len);
    for i in 0..len {
        result.push((a[i], b[i]));
    }
    result
}