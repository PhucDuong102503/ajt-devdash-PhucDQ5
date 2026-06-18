// API fetching module using reusable generic helper
import type { Product, Category, ProductResponse } from './types';

const BASE_URL = 'https://dummyjson.com';

/**
 * Reusable generic helper function to fetch and parse JSON data.
 * Checks for non-ok status codes and handles basic errors.
 */
export async function fetchJson<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch data from ${url}. Status: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as T;
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown network error occurred while fetching ${url}`);
  }
}

/**
 * Fetches all products (limits to 100 for comprehensive local client-side sorting/filtering).
 */
export function fetchProducts(): Promise<ProductResponse> {
  return fetchJson<ProductResponse>(`${BASE_URL}/products?limit=100`);
}

/**
 * Fetches the list of product categories.
 */
export function fetchCategories(): Promise<Category[]> {
  return fetchJson<Category[]>(`${BASE_URL}/products/categories`);
}

/**
 * Searches for products matching the query text.
 */
export function searchProducts(query: string): Promise<ProductResponse> {
  return fetchJson<ProductResponse>(`${BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
}

/**
 * Fetches details for a single product by ID.
 */
export function fetchProductById(id: number): Promise<Product> {
  return fetchJson<Product>(`${BASE_URL}/products/${id}`);
}
