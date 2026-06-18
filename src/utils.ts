// Utilities and helpers

// 1. Debounce implementation (closure) for search/input events
export function debounce<Args extends unknown[]>(
  func: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Args): void {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

// 2. Generic Cache Class with a constraint (Excellent tier)
// Constraints require items to have an ID of string or number.
export interface Identifiable {
  id: string | number;
}

export class CacheManager<T extends Identifiable> {
  private cache = new Map<string | number, { data: T; timestamp: number }>();
  private ttlMs: number;

  constructor(ttlMinutes: number = 5) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  /**
   * Caches an item by its ID.
   */
  set(item: T): void {
    this.cache.set(item.id, {
      data: item,
      timestamp: Date.now(),
    });
  }

  /**
   * Retrieves an item from cache if it exists and is not expired.
   */
  get(id: string | number): T | null {
    const entry = this.cache.get(id);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttlMs;
    if (isExpired) {
      this.cache.delete(id);
      return null;
    }

    return entry.data;
  }

  /**
   * Evicts an item from the cache.
   */
  delete(id: string | number): void {
    this.cache.delete(id);
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

// 3. Exhaustive narrowing helper (Excellent tier)
// If compile-time checking is correct, this will never be reached at runtime.
// If code is added but not handled in switch/if checks, TypeScript flags a compile error.
export function assertNever(x: never): never {
  throw new Error(`Unhandled option/state: ${JSON.stringify(x)}`);
}

// 4. Formatting helper for currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
