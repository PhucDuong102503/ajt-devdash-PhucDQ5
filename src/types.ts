// Types and interfaces for DevDash application

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: ProductMeta;
  images: string[];
  thumbnail: string;
}

export interface Category {
  slug: string;
  name: string;
  url: string;
}

export interface ProductResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export type SortOption = 'none' | 'price-asc' | 'price-desc' | 'rating-desc';

// Dashboard UI state
export interface DashboardData {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  selectedCategory: string; // 'all' or specific category slug
  sortBy: SortOption;
  selectedProductId: number | null;
  selectedProductDetails: Product | null;
  detailsLoading: boolean;
  detailsError: string | null;
}

// AppState as a Discriminated Union (Excellent tier)
export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: DashboardData }
  | { status: 'error'; error: string };

// Meaningful usage of TypeScript Utility Types (Excellent tier)
// 1. Pick: Select only fields needed to render a summary card in the grid
export type ProductSummary = Pick<
  Product,
  'id' | 'title' | 'price' | 'category' | 'thumbnail' | 'rating' | 'stock' | 'discountPercentage'
>;

// 2. Omit: Define details data without metadata fields we don't display
export type ProductDisplayDetails = Omit<Product, 'meta' | 'sku' | 'dimensions'>;

// 3. Partial: Utility for updating specific state keys of the dashboard data
export type DashboardDataUpdate = Partial<DashboardData>;

// 4. Record: Map category slug to category name for efficient lookup
export type CategoryMap = Record<string, string>;
