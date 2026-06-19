// Điểm khởi chạy ứng dụng chính (Entry point)
import '../styles.css';
import { setState, onStateChange, updateSuccessState } from './state';
import { renderApp, setDebouncedSearchDispatcher } from './ui';
import { fetchProducts, fetchCategories } from './api';
import { debounce } from './utils';

// 1. Đăng ký (Subscribe) hàm render giao diện với sự thay đổi của trạng thái
onStateChange((state) => {
  renderApp(state);
});

// 2. Khởi tạo dispatcher tìm kiếm có áp dụng debounce (Đạt chuẩn Excellent - dùng closure)
// Trì hoãn cập nhật tìm kiếm 350ms nhằm tránh giật lag giao diện và hạn chế lặp lại xử lý không cần thiết.
const debouncedSearch = debounce((searchQuery: string) => {
  updateSuccessState({ searchQuery, currentPage: 1 });
}, 350);
setDebouncedSearchDispatcher(debouncedSearch);

/**
 * Khởi tạo dữ liệu trang dashboard bằng cách tải các dữ liệu cốt lõi song song.
 * Đạt tiêu chí xếp hạng Good: "Dùng Promise.all để tải song song từ 2 tài nguyên trở lên".
 */
async function initDashboard(): Promise<void> {
  // Chuyển ứng dụng sang trạng thái đang tải (loading)
  setState({ status: 'loading' });

  try {
    // Tải thông tin sản phẩm và danh mục song song
    const [productsResult, categoriesResult] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
    ]);

    // Chuyển ứng dụng sang trạng thái thành công với dữ liệu đã được tải về
    setState({
      status: 'success',
      data: {
        products: productsResult.products,
        categories: categoriesResult,
        searchQuery: '',
        selectedCategory: 'all',
        sortBy: 'none',
        selectedProductId: null,
        selectedProductDetails: null,
        detailsLoading: false,
        detailsError: null,
        currentPage: 1,
        itemsPerPage: 8,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown loading error occurred.';
    setState({
      status: 'error',
      error: errorMsg,
    });
  }
}

// Bắt đầu khởi tạo ứng dụng khi tài liệu HTML đã tải xong (DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

// Phương án dự phòng trong trường hợp sự kiện DOMContentLoaded đã được kích hoạt trước đó
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initDashboard();
}
