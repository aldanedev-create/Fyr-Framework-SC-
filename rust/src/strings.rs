/**
 * Strings Module
 * String operations exported to WebAssembly
 */

use wasm_bindgen::prelude::*;

/// Reverse a string
#[wasm_bindgen]
pub fn reverse_string(input: &str) -> String {
    input.chars().rev().collect()
}

/// Convert string to uppercase
#[wasm_bindgen]
pub fn to_uppercase(input: &str) -> String {
    input.to_uppercase()
}

/// Convert string to lowercase
#[wasm_bindgen]
pub fn to_lowercase(input: &str) -> String {
    input.to_lowercase()
}

/// Capitalize the first letter of a string
#[wasm_bindgen]
pub fn capitalize(input: &str) -> String {
    if input.is_empty() {
        return String::new();
    }
    let mut chars = input.chars();
    let first = chars.next().unwrap();
    first.to_uppercase().collect::<String>() + chars.as_str()
}

/// Title case a string
#[wasm_bindgen]
pub fn title_case(input: &str) -> String {
    input
        .split_whitespace()
        .map(|word| capitalize(word))
        .collect::<Vec<String>>()
        .join(" ")
}

/// Count the number of characters in a string
#[wasm_bindgen]
pub fn char_count(input: &str) -> usize {
    input.chars().count()
}

/// Count the number of words in a string
#[wasm_bindgen]
pub fn word_count(input: &str) -> usize {
    input.split_whitespace().count()
}

/// Check if a string is a palindrome
#[wasm_bindgen]
pub fn is_palindrome(input: &str) -> bool {
    let cleaned: String = input
        .chars()
        .filter(|c| c.is_alphanumeric())
        .map(|c| c.to_ascii_lowercase())
        .collect();
    let reversed: String = cleaned.chars().rev().collect();
    cleaned == reversed
}

/// Find and replace in a string
#[wasm_bindgen]
pub fn replace_string(input: &str, from: &str, to: &str) -> String {
    input.replace(from, to)
}

/// Remove all whitespace from a string
#[wasm_bindgen]
pub fn remove_whitespace(input: &str) -> String {
    input.chars().filter(|c| !c.is_whitespace()).collect()
}

/// Truncate a string to a maximum length
#[wasm_bindgen]
pub fn truncate(input: &str, max_len: usize) -> String {
    if input.len() <= max_len {
        return input.to_string();
    }
    let truncated: String = input.chars().take(max_len).collect();
    format!("{}...", truncated)
}

/// Extract substring
#[wasm_bindgen]
pub fn substring(input: &str, start: usize, end: usize) -> String {
    let chars: Vec<char> = input.chars().collect();
    if start >= chars.len() || end <= start {
        return String::new();
    }
    let end = end.min(chars.len());
    chars[start..end].iter().collect()
}

/// Count occurrences of a substring
#[wasm_bindgen]
pub fn count_occurrences(input: &str, pattern: &str) -> usize {
    if pattern.is_empty() {
        return 0;
    }
    input.matches(pattern).count()
}

/// Slugify a string (convert to URL-friendly format)
#[wasm_bindgen]
pub fn slugify(input: &str) -> String {
    input
        .to_lowercase()
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ')
        .map(|c| if c == ' ' { '-' } else { c })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<&str>>()
        .join("-")
}

/// Base64 encode a string
#[wasm_bindgen]
pub fn base64_encode(input: &str) -> String {
    use base64::{engine::general_purpose, Engine as _};
    general_purpose::STANDARD.encode(input.as_bytes())
}

/// Base64 decode a string
#[wasm_bindgen]
pub fn base64_decode(input: &str) -> Result<String, JsValue> {
    use base64::{engine::general_purpose, Engine as _};
    match general_purpose::STANDARD.decode(input) {
        Ok(bytes) => match String::from_utf8(bytes) {
            Ok(s) => Ok(s),
            Err(e) => Err(JsValue::from_str(&format!("Invalid UTF-8: {}", e))),
        },
        Err(e) => Err(JsValue::from_str(&format!("Invalid base64: {}", e))),
    }
}