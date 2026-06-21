// Quản lý Trạng thái Ứng dụng (State Management)
import type { AppState, DashboardDataUpdate } from './types';

// Trạng thái ban đầu là idle
let appState: AppState = { status: 'idle' };

type StateChangeListener = (state: AppState) => void;
const listeners: StateChangeListener[] = [];

/**
 * Trả về trạng thái ứng dụng hiện tại.
 */
export function getState(): AppState {
  return appState;
}

/**
 * Cập nhật trạng thái và thông báo cho tất cả listener đã đăng ký.
 */
export function setState(newState: AppState): void {
  appState = newState;
  listeners.forEach((listener) => listener(appState));
}

/**
 * Hàm bổ trợ để chỉ cập nhật một phần dữ liệu dashboard khi trạng thái hiện tại là 'success'.
 */
export function updateSuccessState(update: DashboardDataUpdate): void {
  if (appState.status === 'success') {
    appState = {
      ...appState,
      data: {
        ...appState.data,
        ...update,
      },
    };
    listeners.forEach((listener) => listener(appState));
  }
}

/**
 * Đăng ký một callback listener để chạy khi trạng thái thay đổi.
 */
export function onStateChange(listener: StateChangeListener): void {
  listeners.push(listener);
}
