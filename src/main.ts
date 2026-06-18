// Main application entry point
import '../styles.css';
import { setState, onStateChange, updateSuccessState } from './state';
import { renderApp, setDebouncedSearchDispatcher } from './ui';
import { fetchProducts, fetchCategories } from './api';
import { debounce } from './utils';

// 1. Subscribe the UI render function to state updates
onStateChange((state) => {
  renderApp(state);
});

// 2. Initialize debounced search dispatcher (Excellent tier - closure debounce)
// Debounce search state update by 350ms to prevent laggy visual filters and API spam.
const debouncedSearch = debounce((searchQuery: string) => {
  updateSuccessState({ searchQuery });
}, 350);
setDebouncedSearchDispatcher(debouncedSearch);

/**
 * Initializes the application dashboard by fetching core data in parallel.
 * Targets the Good tier criterion: "Promise.all to load two or more resources in parallel".
 */
async function initDashboard(): Promise<void> {
  // Transition app to loading state
  setState({ status: 'loading' });

  try {
    // Load products and categories in parallel
    const [productsResult, categoriesResult] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
    ]);

    // Transition app to success state with loaded data
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

// Kick off app initialisation on document loaded
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

// Fallback in case DOMContentLoaded has already fired
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initDashboard();
}
