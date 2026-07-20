/**
 * Memory Module
 * Memory management for WebAssembly
 */

use wasm_bindgen::prelude::*;
use std::cell::RefCell;

/// Memory allocation tracker
thread_local! {
    static ALLOCATIONS: RefCell<Vec<*mut u8>> = RefCell::new(Vec::new());
}

/// Initialize memory management
#[wasm_bindgen]
pub fn init_memory() {
    // Set up memory tracking
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Allocate memory in the WASM linear memory
/// Returns a pointer to the allocated memory
#[wasm_bindgen]
pub fn malloc(size: usize) -> *mut u8 {
    let layout = std::alloc::Layout::from_size_align(size, 1).unwrap();
    unsafe {
        let ptr = std::alloc::alloc(layout);
        if !ptr.is_null() {
            ALLOCATIONS.with(|allocations| {
                allocations.borrow_mut().push(ptr);
            });
        }
        ptr
    }
}

/// Free allocated memory
#[wasm_bindgen]
pub fn free(ptr: *mut u8) {
    if ptr.is_null() {
        return;
    }

    // Remove from allocations list
    ALLOCATIONS.with(|allocations| {
        let mut borrow = allocations.borrow_mut();
        if let Some(pos) = borrow.iter().position(|&p| p == ptr) {
            borrow.remove(pos);
        }
    });

    // Deallocate the memory
    unsafe {
        let _ = std::alloc::Layout::from_size_align(1, 1);
        // Using System allocator directly
        std::alloc::dealloc(ptr, std::alloc::Layout::from_size_align(1, 1).unwrap());
    }
}

/// Free all allocated memory
#[wasm_bindgen]
pub fn free_all() {
    ALLOCATIONS.with(|allocations| {
        let mut borrow = allocations.borrow_mut();
        for &ptr in borrow.iter() {
            unsafe {
                std::alloc::dealloc(ptr, std::alloc::Layout::from_size_align(1, 1).unwrap());
            }
        }
        borrow.clear();
    });
}

/// Get the number of active allocations
#[wasm_bindgen]
pub fn allocation_count() -> usize {
    ALLOCATIONS.with(|allocations| allocations.borrow().len())
}

/// Write a string to WASM memory at the given pointer
#[wasm_bindgen]
pub fn write_string(ptr: *mut u8, value: &str) {
    if ptr.is_null() {
        return;
    }
    let bytes = value.as_bytes();
    unsafe {
        std::ptr::copy(bytes.as_ptr(), ptr, bytes.len());
        // Add null terminator
        ptr.add(bytes.len()).write(0);
    }
}

/// Read a string from WASM memory at the given pointer
#[wasm_bindgen]
pub fn read_string(ptr: *const u8) -> String {
    if ptr.is_null() {
        return String::new();
    }
    let mut len = 0;
    unsafe {
        while *ptr.add(len) != 0 {
            len += 1;
        }
        let slice = std::slice::from_raw_parts(ptr, len);
        String::from_utf8_lossy(slice).to_string()
    }
}

/// Write bytes to WASM memory at the given pointer
#[wasm_bindgen]
pub fn write_bytes(ptr: *mut u8, data: &[u8]) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        std::ptr::copy(data.as_ptr(), ptr, data.len());
    }
}

/// Read bytes from WASM memory at the given pointer
#[wasm_bindgen]
pub fn read_bytes(ptr: *const u8, len: usize) -> Vec<u8> {
    if ptr.is_null() {
        return Vec::new();
    }
    unsafe {
        std::slice::from_raw_parts(ptr, len).to_vec()
    }
}

/// Copy memory from one location to another
#[wasm_bindgen]
pub fn memcopy(dest: *mut u8, src: *const u8, len: usize) {
    if dest.is_null() || src.is_null() {
        return;
    }
    unsafe {
        std::ptr::copy(src, dest, len);
    }
}

/// Set memory to a value
#[wasm_bindgen]
pub fn memset(ptr: *mut u8, value: u8, len: usize) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        std::ptr::write_bytes(ptr, value, len);
    }
}

/// Get the size of the WASM memory
#[wasm_bindgen]
pub fn memory_size() -> usize {
    let memory = wasm_bindgen::memory();
    if let Some(js_val) = memory.dyn_ref::<js_sys::WebAssembly::Memory>() {
        js_val.buffer().byte_length() as usize
    } else {
        0
    }
}

/// Grow the WASM memory by pages
#[wasm_bindgen]
pub fn grow_memory(pages: u32) -> u32 {
    let memory = wasm_bindgen::memory();
    if let Some(js_val) = memory.dyn_ref::<js_sys::WebAssembly::Memory>() {
        js_val.grow(pages)
    } else {
        0
    }
}

/// Get memory usage statistics
#[wasm_bindgen]
pub fn memory_stats() -> String {
    let total = memory_size();
    let allocations = allocation_count();
    format!(
        "{{ \"total_bytes\": {}, \"allocations\": {} }}",
        total, allocations
    )
}