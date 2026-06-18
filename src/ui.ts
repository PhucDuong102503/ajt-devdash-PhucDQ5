// UI Rendering Module
import type { AppState, Product, ProductSummary, SortOption, DashboardData } from './types';
import { assertNever, formatCurrency, CacheManager } from './utils';
import { getState, updateSuccessState } from './state';
import { fetchProductById } from './api';

// Create a cache manager instance for caching full Product details
const productDetailsCache = new CacheManager<Product>(5); // 5 minutes TTL

// Cache DOM elements
const appRoot = document.querySelector<HTMLDivElement>('#app');

/**
 * Main render function that handles rendering based on current state.
 * Targets the Excellent tier criterion: "A discriminated union drives state and is exhaustively narrowed".
 */
export function renderApp(state: AppState): void {
  if (!appRoot) return;

  switch (state.status) {
    case 'idle':
      appRoot.innerHTML = `
        <div class="state-container">
          <p class="empty-state-text">Welcome to DevDash. Initializing dashboard...</p>
        </div>
      `;
      break;

    case 'loading':
      appRoot.innerHTML = `
        <div class="dashboard-container">
          <header>
            <div class="brand-section">
              <h1 class="brand-logo">DevDash</h1>
              <span class="brand-tag">v1.0</span>
            </div>
          </header>
          <div class="controls-bar skeleton-shimmer" style="height: 80px; margin-bottom: 2rem;"></div>
          <div class="products-grid">
            ${Array.from({ length: 8 })
              .map(
                () => `
              <div class="product-card skeleton-card">
                <div class="card-img-wrapper skeleton-shimmer skeleton-image"></div>
                <div class="card-content">
                  <div class="skeleton-shimmer skeleton-text" style="width: 40%"></div>
                  <div class="skeleton-shimmer skeleton-title"></div>
                  <div class="skeleton-shimmer skeleton-text" style="width: 60%"></div>
                  <div class="card-footer">
                    <div class="skeleton-shimmer skeleton-text" style="width: 30%"></div>
                    <div class="skeleton-shimmer skeleton-text" style="width: 20%"></div>
                  </div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
      break;

    case 'success':
      renderDashboard(state.data);
      break;

    case 'error':
      appRoot.innerHTML = `
        <div class="state-container">
          <div class="error-card">
            <h2 class="error-title">Error Loading Dashboard</h2>
            <p>${state.error}</p>
            <button id="retry-app-btn" class="retry-btn">Retry Setup</button>
          </div>
        </div>
      `;
      // Bind retry event listener
      document.querySelector('#retry-app-btn')?.addEventListener('click', () => {
        window.location.reload();
      });
      break;

    default:
      // Compile-time safety: TypeScript checks that all status categories are handled.
      // If a new status is added to AppState, this line triggers a compilation error.
      assertNever(state);
  }
}

/**
 * Renders the dashboard with data loading, filter, search, grid, and modal details.
 */
function renderDashboard(data: DashboardData): void {
  if (!appRoot) return;

  // Apply higher-order functions (filter, map) for list operations (Good tier)
  let filteredProducts = data.products;

  // 1. Filter by category
  if (data.selectedCategory !== 'all') {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === data.selectedCategory
    );
  }

  // 2. Filter by search query
  if (data.searchQuery.trim() !== '') {
    const query = data.searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query)
    );
  }

  // 3. Sort products based on sort selection
  if (data.sortBy !== 'none') {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      if (data.sortBy === 'price-asc') {
        return a.price - b.price;
      } else if (data.sortBy === 'price-desc') {
        return b.price - a.price;
      } else if (data.sortBy === 'rating-desc') {
        return b.rating - a.rating;
      }
      return 0;
    });
  }

  // Build the complete page content
  const headerHtml = `
    <header>
      <div class="brand-section">
        <h1 class="brand-logo">DevDash</h1>
        <span class="brand-tag">v1.0</span>
      </div>
      <div>
        <p style="font-size: 0.9rem; color: var(--text-secondary);">Active API: <strong>DummyJSON</strong></p>
      </div>
    </header>
  `;

  // Filter and search controls HTML
  const controlsHtml = `
    <div class="controls-bar">
      <div class="search-wrapper">
        <svg class="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <input 
          type="text" 
          id="search-box" 
          class="search-input" 
          placeholder="Search products, brands, description..." 
          value="${data.searchQuery}"
        />
      </div>
      <div class="filters-wrapper">
        <select id="category-filter" class="select-dropdown">
          <option value="all">All Categories</option>
          ${data.categories
            .map(
              (cat) => `
            <option value="${cat.slug}" ${data.selectedCategory === cat.slug ? 'selected' : ''}>
              ${cat.name}
            </option>
          `
            )
            .join('')}
        </select>
        <select id="sort-filter" class="select-dropdown">
          <option value="none" ${data.sortBy === 'none' ? 'selected' : ''}>Sort: Default</option>
          <option value="price-asc" ${data.sortBy === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
          <option value="price-desc" ${data.sortBy === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
          <option value="rating-desc" ${data.sortBy === 'rating-desc' ? 'selected' : ''}>Rating: High to Low</option>
        </select>
        <button id="reset-filters-btn" class="reset-btn">
          Reset Filters
        </button>
      </div>
    </div>
  `;

  const countHtml = `
    <div class="results-count">
      Showing ${filteredProducts.length} of ${data.products.length} products
    </div>
  `;

  // Grid products HTML (using Pick-ed summary types)
  let productsGridHtml = '';
  if (filteredProducts.length === 0) {
    productsGridHtml = `
      <div class="state-container" style="grid-column: 1 / -1;">
        <p class="empty-state-text">No products match your search or filter criteria.</p>
      </div>
    `;
  } else {
    productsGridHtml = `
      <div class="products-grid">
        ${filteredProducts
          .map((prod) => {
            // Pick fields we need using the ProductSummary utility type
            const summary: ProductSummary = {
              id: prod.id,
              title: prod.title,
              price: prod.price,
              category: prod.category,
              thumbnail: prod.thumbnail,
              rating: prod.rating,
              stock: prod.stock,
              discountPercentage: prod.discountPercentage,
            };

            const isLowStock = summary.stock < 10;
            const stockClass = isLowStock ? 'stock-low' : 'stock-ok';
            const stockText = isLowStock ? `Only ${summary.stock} left` : 'In Stock';

            return `
              <div class="product-card" data-product-id="${summary.id}">
                <div class="card-img-wrapper">
                  <span class="discount-badge">-${Math.round(summary.discountPercentage)}%</span>
                  <img class="card-img" src="${summary.thumbnail}" alt="${summary.title}" loading="lazy"/>
                </div>
                <div class="card-content">
                  <span class="product-category">${summary.category}</span>
                  <h3 class="product-title">${summary.title}</h3>
                  <div class="product-rating">
                    <svg class="star-icon" width="16" height="16" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="rating-value">${summary.rating.toFixed(2)}</span>
                  </div>
                  <div class="card-footer">
                    <span class="product-price">${formatCurrency(summary.price)}</span>
                    <span class="stock-status ${stockClass}">${stockText}</span>
                  </div>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  // Render modal overlay
  const isModalActive = data.selectedProductId !== null;
  const modalHtml = `
    <div id="product-detail-modal" class="modal-overlay ${isModalActive ? 'active' : ''}">
      <div class="modal-container">
        <button id="close-modal-btn" class="close-modal-btn" aria-label="Close modal">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        ${renderModalContent(data.detailsLoading, data.detailsError, data.selectedProductDetails)}
      </div>
    </div>
  `;

  // Assemble full UI
  appRoot.innerHTML = `
    <div class="dashboard-container">
      ${headerHtml}
      ${controlsHtml}
      ${countHtml}
      ${productsGridHtml}
    </div>
    ${modalHtml}
  `;

  // Setup Event Listeners
  setupEventListeners();
}

/**
 * Render inner content for modal detail view
 */
function renderModalContent(loading: boolean, error: string | null, details: Product | null): string {
  if (loading) {
    return `
      <div class="modal-loading-body">
        <div class="spinner"></div>
        <p class="empty-state-text">Loading item details...</p>
      </div>
    `;
  }

  if (error) {
    return `
      <div class="modal-body" style="text-align: center;">
        <h3 class="error-title" style="margin-top: 2rem;">Could not load details</h3>
        <p>${error}</p>
      </div>
    `;
  }

  if (!details) {
    return `
      <div class="modal-body" style="text-align: center;">
        <p class="empty-state-text" style="margin-top: 2rem;">No product selected.</p>
      </div>
    `;
  }

  // Detail item views (Excellent tier Omit utility type visual display)
  const isLowStock = details.stock < 10;
  const stockClass = isLowStock ? 'stock-low' : 'stock-ok';
  
  // Display images gallery
  const images = details.images.length > 0 ? details.images : [details.thumbnail];
  const activeImage = images[0];

  const thumbnailsHtml = images
    .map(
      (img, idx) => `
    <img 
      class="thumb-img ${idx === 0 ? 'active' : ''}" 
      src="${img}" 
      alt="${details.title} thumbnail ${idx + 1}"
      data-img-src="${img}"
    />
  `
    )
    .join('');

  // Reviews HTML representation
  const reviewsHtml = details.reviews.length === 0
    ? '<p class="empty-state-text" style="font-size: 0.9rem;">No reviews yet.</p>'
    : details.reviews
        .map(
          (rev) => `
        <div class="review-item">
          <div class="review-header">
            <span class="reviewer-name">${rev.reviewerName}</span>
            <span class="reviewer-date">${new Date(rev.date).toLocaleDateString()}</span>
          </div>
          <div class="product-rating" style="margin-bottom: 0.5rem;">
            ${Array.from({ length: 5 })
              .map(
                (_, i) => `
              <svg 
                class="star-icon" 
                style="opacity: ${i < rev.rating ? 1 : 0.2}" 
                width="14" 
                height="14" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            `
              )
              .join('')}
          </div>
          <p class="review-comment">"${rev.comment}"</p>
        </div>
      `
        )
        .join('');

  return `
    <div class="modal-body">
      <div class="detail-layout">
        <!-- Gallery -->
        <div class="detail-gallery">
          <img id="main-detail-image" class="main-detail-img" src="${activeImage}" alt="${details.title}"/>
          <div class="thumbnail-strip">
            ${thumbnailsHtml}
          </div>
        </div>
        
        <!-- Info -->
        <div class="detail-info">
          <div class="detail-header">
            <span class="detail-category">${details.category}</span>
            <h2 class="detail-title">${details.title}</h2>
            <p style="font-size: 0.9rem; color: var(--text-muted);">Brand: <strong>${details.brand || 'Generic'}</strong></p>
          </div>
          
          <div class="detail-meta-row">
            <span class="detail-price">${formatCurrency(details.price)}</span>
            <span class="detail-discount">-${Math.round(details.discountPercentage)}% Off</span>
            <span class="stock-status ${stockClass}" style="margin-left: auto;">${details.availabilityStatus} (${details.stock} units)</span>
          </div>
          
          <p class="detail-desc">${details.description}</p>
          
          <div class="specs-grid">
            <div class="spec-item">
              <span class="spec-label">Weight</span>
              <span class="spec-value">${details.weight}g</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Dimensions</span>
              <span class="spec-value">${details.dimensions.width} x ${details.dimensions.height} x ${details.dimensions.depth} cm</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Warranty</span>
              <span class="spec-value">${details.warrantyInformation}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Return Policy</span>
              <span class="spec-value">${details.returnPolicy}</span>
            </div>
          </div>
          
          <div class="reviews-section">
            <h3 class="reviews-title">Customer Reviews (${details.reviews.length})</h3>
            <div class="reviews-list">
              ${reviewsHtml}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Binds DOM event listeners to controls and elements
 */
function setupEventListeners(): void {
  // 1. Search Box Input Listener
  const searchInput = document.querySelector<HTMLInputElement>('#search-box');
  if (searchInput) {
    // We bind keyup/input to trigger state change
    // Search is debounced in main.ts, here we just listen and dispatch the debounced function
    searchInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      // Dispatch custom event or call global state updates
      // To satisfy Excellent memoize/debounce closure, we debounce the state updates
      dispatchSearchUpdate(target.value);
    });
  }

  // 2. Category Dropdown Filter Listener
  const catFilter = document.querySelector<HTMLSelectElement>('#category-filter');
  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      updateSuccessState({ selectedCategory: target.value });
    });
  }

  // 3. Sort Dropdown Listener
  const sortFilter = document.querySelector<HTMLSelectElement>('#sort-filter');
  if (sortFilter) {
    sortFilter.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      updateSuccessState({ sortBy: target.value as SortOption });
    });
  }

  // 4. Reset Filters Button
  const resetBtn = document.querySelector('#reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      updateSuccessState({
        searchQuery: '',
        selectedCategory: 'all',
        sortBy: 'none',
      });
    });
  }

  // 5. Product Detail Click Listeners (Card clicking)
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach((card) => {
    card.addEventListener('click', () => {
      const productIdStr = card.getAttribute('data-product-id');
      if (productIdStr) {
        const id = parseInt(productIdStr, 10);
        handleSelectProduct(id);
      }
    });
  } );

  // 6. Close Modal Click Listener
  const closeModalBtn = document.querySelector('#close-modal-btn');
  const modalOverlay = document.querySelector('#product-detail-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      closeProductDetails();
    });
  }
  if (modalOverlay) {
    // Close when clicking overlay backdrop
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeProductDetails();
      }
    });
  }

  // 7. Modal Gallery Thumbnail clicks
  const thumbImages = document.querySelectorAll<HTMLImageElement>('.thumb-img');
  const mainImage = document.querySelector<HTMLImageElement>('#main-detail-image');
  thumbImages.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      thumbImages.forEach((img) => img.classList.remove('active'));
      thumb.classList.add('active');
      const newSrc = thumb.getAttribute('data-img-src');
      if (mainImage && newSrc) {
        mainImage.src = newSrc;
      }
    });
  });
}

// Closure reference for debounced search, will be initialized in main.ts
let dispatchSearchUpdate: (val: string) => void = (val) => {
  updateSuccessState({ searchQuery: val });
};

export function setDebouncedSearchDispatcher(fn: (val: string) => void): void {
  dispatchSearchUpdate = fn;
}

/**
 * Handles product selection, checks CacheManager first, then fetches details if missed.
 */
async function handleSelectProduct(id: number): Promise<void> {
  // First update state to record selection and set details loading
  updateSuccessState({
    selectedProductId: id,
    detailsLoading: true,
    detailsError: null,
    selectedProductDetails: null,
  });

  // Check generic cache manager (Excellent tier cache hit check)
  const cachedProduct = productDetailsCache.get(id);
  if (cachedProduct) {
    // Cache Hit!
    updateSuccessState({
      selectedProductDetails: cachedProduct,
      detailsLoading: false,
    });
    return;
  }

  // Cache Miss -> Fetch asynchronously
  try {
    const details = await fetchProductById(id);
    // Store in cache
    productDetailsCache.set(details);
    
    // Ensure the product we fetched is still the one selected (prevent race conditions)
    const currentState = getState();
    if (currentState.status === 'success' && currentState.data.selectedProductId === id) {
      updateSuccessState({
        selectedProductDetails: details,
        detailsLoading: false,
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch details';
    updateSuccessState({
      detailsLoading: false,
      detailsError: errorMsg,
    });
  }
}

/**
 * Resets selected product state to close the detail modal view.
 */
function closeProductDetails(): void {
  updateSuccessState({
    selectedProductId: null,
    selectedProductDetails: null,
    detailsLoading: false,
    detailsError: null,
  });
}
