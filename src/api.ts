// Module gọi API sử dụng hàm bổ trợ generic tái sử dụng
import type { Product, Category, ProductResponse } from './types';

const BASE_URL = 'https://dummyjson.com';

/**
 * Hàm bổ trợ generic tái sử dụng để tải (fetch) và phân tích (parse) dữ liệu JSON.
 * Kiểm tra mã trạng thái phản hồi (response status) và xử lý các lỗi cơ bản.
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
 * Tải toàn bộ sản phẩm (giới hạn 100 mục để thực hiện lọc/sắp xếp cục bộ phía client).
 */
export function fetchProducts(): Promise<ProductResponse> {
  return fetchJson<ProductResponse>(`${BASE_URL}/products?limit=100`);
}

/**
 * Tải danh sách các danh mục sản phẩm.
 */
export function fetchCategories(): Promise<Category[]> {
  return fetchJson<Category[]>(`${BASE_URL}/products/categories`);
}

/**
 * Tìm kiếm sản phẩm khớp với từ khóa truy vấn.
 */
export function searchProducts(query: string): Promise<ProductResponse> {
  return fetchJson<ProductResponse>(`${BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
}

/**
 * Tải chi tiết một sản phẩm bằng ID.
 */
export function fetchProductById(id: number): Promise<Product> {
  return fetchJson<Product>(`${BASE_URL}/products/${id}`);
}
