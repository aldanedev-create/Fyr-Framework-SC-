pub fn add(a: i32, b: i32) -> i32 {
    a.saturating_add(b)
}

pub fn subtract(a: i32, b: i32) -> i32 {
    a.saturating_sub(b)
}

pub fn multiply(a: i32, b: i32) -> i32 {
    a.saturating_mul(b)
}

pub fn divide(a: i32, b: i32) -> i32 {
    a.checked_div(b).unwrap_or(0)
}

pub fn power(a: i32, b: i32) -> i32 {
    if b < 0 {
        return 0;
    }

    let mut result: i32 = 1;
    for _ in 0..b {
        result = result.saturating_mul(a);
    }
    result
}

pub fn factorial(n: u32) -> u32 {
    (2..=n).fold(1, u32::saturating_mul)
}

pub fn fibonacci(n: u32) -> u32 {
    let (mut a, mut b) = (0_u32, 1_u32);
    for _ in 0..n {
        (a, b) = (b, a.saturating_add(b));
    }
    a
}

pub fn gcd(mut a: u32, mut b: u32) -> u32 {
    while b != 0 {
        (a, b) = (b, a % b);
    }
    a
}

pub fn lcm(a: u32, b: u32) -> u32 {
    if a == 0 || b == 0 {
        return 0;
    }
    (a / gcd(a, b)).saturating_mul(b)
}

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

    let mut divisor = 5;
    while divisor <= n / divisor {
        if n % divisor == 0 || n % (divisor + 2) == 0 {
            return false;
        }
        divisor += 6;
    }
    true
}
