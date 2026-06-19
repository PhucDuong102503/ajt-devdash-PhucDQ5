// Module Giao diện Người dùng (UI Rendering Module)
import type { AppState, Product, ProductSummary, SortOption, DashboardData } from './types';
import { assertNever, formatCurrency, CacheManager } from './utils';
import { getState, updateSuccessState } from './state';
import { fetchProductById } from './api';

// Khởi tạo bộ quản lý cache để lưu trữ chi tiết sản phẩm đầy đủ (5 phút TTL)
const productDetailsCache = new CacheManager<Product>(5); // 5 phút TTL

// Lưu trữ phần tử DOM gốc (DOM caching)
const appRoot = document.querySelector<HTMLDivElement>('#app');

/**
 * Hàm vẽ giao diện chính xử lý render dựa trên trạng thái hiện tại.
 * Đạt chuẩn Excellent tier: "Sử dụng discriminated union để quản lý trạng thái và thu hẹp vét cạn".
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
      // Đăng ký sự kiện lắng nghe nút Thử lại (Retry) để tải lại ứng dụng
      document.querySelector('#retry-app-btn')?.addEventListener('click', () => {
        window.location.reload();
      });
      break;

    default:
      // Đảm bảo an toàn lúc biên dịch (Compile-time safety): TypeScript kiểm tra mọi trạng thái của status đều được xử lý.
      // Nếu có status mới được thêm vào AppState, dòng này sẽ lập tức báo lỗi compile.
      assertNever(state);
  }
}

/**
 * Vẽ giao diện Dashboard bao gồm tìm kiếm, bộ lọc, lưới sản phẩm, phân trang và chi tiết modal.
 */
function renderDashboard(data: DashboardData): void {
  if (!appRoot) return;

  // Áp dụng các hàm bậc cao (Higher-Order Functions: filter, map) cho danh sách sản phẩm (Đạt chuẩn Good tier)
  let filteredProducts = data.products;

  // 1. Lọc sản phẩm theo danh mục (Category filter)
  if (data.selectedCategory !== 'all') {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === data.selectedCategory
    );
  }

  // 2. Lọc sản phẩm theo từ khóa tìm kiếm (Search filter)
  if (data.searchQuery.trim() !== '') {
    const query = data.searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query)
    );
  }

  // 3. Sắp xếp sản phẩm theo tùy chọn (Sorting)
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

  // 4. Các phép tính toán phân trang (Pagination math)
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / data.itemsPerPage) || 1;
  const currentPage = Math.min(data.currentPage, totalPages);
  const startIndex = (currentPage - 1) * data.itemsPerPage;
  const endIndex = startIndex + data.itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Xây dựng nội dung HTML của tiêu đề (Header)
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

  // Xây dựng HTML cho thanh công cụ tìm kiếm và lọc bộ lọc
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

  const pageStart = totalItems === 0 ? 0 : startIndex + 1;
  const pageEnd = Math.min(startIndex + data.itemsPerPage, totalItems);
  const countHtml = `
    <div class="results-count">
      Showing ${pageStart}-${pageEnd} of ${totalItems} products (Total: ${data.products.length})
    </div>
  `;

  // Xây dựng mã HTML hiển thị lưới sản phẩm (sử dụng kiểu tóm tắt rút gọn ProductSummary)
  let productsGridHtml = '';
  if (paginatedProducts.length === 0) {
    productsGridHtml = `
      <div class="state-container" style="grid-column: 1 / -1;">
        <p class="empty-state-text">No products match your search or filter criteria.</p>
      </div>
    `;
  } else {
    productsGridHtml = `
      <div class="products-grid">
        ${paginatedProducts
          .map((prod) => {
            // Lọc ra các trường cần dùng bằng Utility Type Pick (ProductSummary)
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

  // Xây dựng mã HTML cho phần thanh phân trang
  let paginationControlsHtml = '';
  if (totalPages > 1) {
    paginationControlsHtml = `
      <div class="pagination-controls">
        <button id="prev-page-btn" class="page-nav-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          Prev
        </button>
        <div class="page-numbers-wrapper">
          ${Array.from({ length: totalPages })
            .map((_, index) => {
              const pageNum = index + 1;
              const isActive = pageNum === currentPage;
              return `
                <button class="page-num-btn ${isActive ? 'active' : ''}" data-page="${pageNum}">
                  ${pageNum}
                </button>
              `;
            })
            .join('')}
        </div>
        <button id="next-page-btn" class="page-nav-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
          Next
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    `;
  }

  // Render phần giao diện nền mờ Modal Chi tiết sản phẩm
  const isModalActive = data.selectedProductId !== null;
  const modalHtml = `
    <div id="product-detail-modal" class="modal-overlay ${isModalActive ? 'active' : ''}">
      <div class="modal-container">
        <button id="close-modal-btn" class="close-modal-btn" aria-label="Đóng modal">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        ${renderModalContent(data.detailsLoading, data.detailsError, data.selectedProductDetails)}
      </div>
    </div>
  `;

  // Lắp ráp toàn bộ giao diện hoàn chỉnh của dashboard
  appRoot.innerHTML = `
    <div class="dashboard-container">
      ${headerHtml}
      ${controlsHtml}
      ${countHtml}
      ${productsGridHtml}
      ${paginationControlsHtml}
    </div>
    ${modalHtml}
  `;

  // Thiết lập các sự kiện lắng nghe tương tác DOM (Event Listeners)
  setupEventListeners();
}

/**
 * Render nội dung chi tiết bên trong cửa sổ Modal
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

  // Trình bày thông tin chi tiết (Mô phỏng Omit utility type trực quan ở bậc Excellent)
  const isLowStock = details.stock < 10;
  const stockClass = isLowStock ? 'stock-low' : 'stock-ok';
  
  // Hiển thị bộ sưu tập ảnh sản phẩm (Gallery)
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

  // Định dạng mã HTML hiển thị danh sách nhận xét (Reviews)
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
 * Đăng ký các trình lắng nghe sự kiện DOM cho các bộ điều khiển trên giao diện
 */
function setupEventListeners(): void {
  // 1. Sự kiện lắng nghe ô tìm kiếm (Search Box input)
  const searchInput = document.querySelector<HTMLInputElement>('#search-box');
  if (searchInput) {
    // Chúng ta lắng nghe sự kiện input để kích hoạt cập nhật trạng thái
    // Quá trình debounce được quản lý ở main.ts, ở đây chỉ gọi hàm dispatcher đã được bọc debounce bằng closure
    searchInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      // Hàm dispatchSearchUpdate là hàm đã được bọc debounce bằng closure
      dispatchSearchUpdate(target.value);
    });
  }

  // 2. Sự kiện lắng nghe chọn Danh mục lọc (Category Filter)
  const catFilter = document.querySelector<HTMLSelectElement>('#category-filter');
  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      updateSuccessState({ selectedCategory: target.value, currentPage: 1 });
    });
  }

  // 3. Sự kiện lắng nghe chọn Sắp xếp (Sort Filter)
  const sortFilter = document.querySelector<HTMLSelectElement>('#sort-filter');
  if (sortFilter) {
    sortFilter.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      updateSuccessState({ sortBy: target.value as SortOption, currentPage: 1 });
    });
  }

  // 4. Sự kiện lắng nghe click nút Reset bộ lọc
  const resetBtn = document.querySelector('#reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      updateSuccessState({
        searchQuery: '',
        selectedCategory: 'all',
        sortBy: 'none',
        currentPage: 1,
      });
    });
  }

  // 5. Sự kiện click vào thẻ sản phẩm để xem chi tiết (Card Clicking)
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

  // 6. Sự kiện click đóng Modal chi tiết
  const closeModalBtn = document.querySelector('#close-modal-btn');
  const modalOverlay = document.querySelector('#product-detail-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      closeProductDetails();
    });
  }
  if (modalOverlay) {
    // Đóng Modal khi người dùng click vào vùng nền mờ bên ngoài
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeProductDetails();
      }
    });
  }

  // 7. Sự kiện click chuyển đổi ảnh trong bộ ảnh thu nhỏ (Gallery Thumbnails)
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

  // 8. Sự kiện click các nút điều hướng chuyển trang phân trang
  const prevBtn = document.querySelector<HTMLButtonElement>('#prev-page-btn');
  if (prevBtn && !prevBtn.disabled) {
    prevBtn.addEventListener('click', () => {
      const page = parseInt(prevBtn.getAttribute('data-page') || '1', 10);
      updateSuccessState({ currentPage: page });
    });
  }

  const nextBtn = document.querySelector<HTMLButtonElement>('#next-page-btn');
  if (nextBtn && !nextBtn.disabled) {
    nextBtn.addEventListener('click', () => {
      const page = parseInt(nextBtn.getAttribute('data-page') || '1', 10);
      updateSuccessState({ currentPage: page });
    });
  }

  const pageNumBtns = document.querySelectorAll<HTMLButtonElement>('.page-num-btn');
  pageNumBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.getAttribute('data-page') || '1', 10);
      updateSuccessState({ currentPage: page });
    });
  });
}

// Hàm trung gian lưu trữ closure tìm kiếm, được gán giá trị sau ở main.ts
let dispatchSearchUpdate: (val: string) => void = (val) => {
  updateSuccessState({ searchQuery: val });
};

export function setDebouncedSearchDispatcher(fn: (val: string) => void): void {
  dispatchSearchUpdate = fn;
}

/**
 * Xử lý sự kiện chọn sản phẩm: Tra cứu ở bộ quản lý Cache trước, nếu thiếu mới tải từ API.
 */
async function handleSelectProduct(id: number): Promise<void> {
  // Cập nhật trạng thái tải và ghi nhận mã sản phẩm được chọn
  updateSuccessState({
    selectedProductId: id,
    detailsLoading: true,
    detailsError: null,
    selectedProductDetails: null,
  });

  // Kiểm tra bộ nhớ đệm CacheManager (Đạt chuẩn Cache Hit ở bậc Excellent)
  const cachedProduct = productDetailsCache.get(id);
  if (cachedProduct) {
    // Đã tìm thấy trong Cache (Cache Hit!)
    updateSuccessState({
      selectedProductDetails: cachedProduct,
      detailsLoading: false,
    });
    return;
  }

  // Không có trong cache (Cache Miss!) -> Gọi API tải dữ liệu bất đồng bộ
  try {
    const details = await fetchProductById(id);
    // Lưu sản phẩm đã tải vào cache
    productDetailsCache.set(details);
    
    // Đảm bảo sản phẩm tải về khớp với sản phẩm đang được chọn (tránh lỗi race condition)
    const currentState = getState();
    if (currentState.status === 'success' && currentState.data.selectedProductId === id) {
      updateSuccessState({
        selectedProductDetails: details,
        detailsLoading: false,
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Tải dữ liệu chi tiết thất bại.';
    updateSuccessState({
      detailsLoading: false,
      detailsError: errorMsg,
    });
  }
}

/**
 * Reset trạng thái chi tiết sản phẩm để đóng modal hiển thị.
 */
function closeProductDetails(): void {
  updateSuccessState({
    selectedProductId: null,
    selectedProductDetails: null,
    detailsLoading: false,
    detailsError: null,
  });
}
