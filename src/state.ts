// Application State Management
import type { AppState, DashboardDataUpdate } from './types';

// Initial state is idle
let appState: AppState = { status: 'idle' };

type StateChangeListener = (state: AppState) => void;
const listeners: StateChangeListener[] = [];

/**
 * Returns the current application state.
 */
export function getState(): AppState {
  return appState;
}

/**
 * Updates the state and notifies all registered listeners.
 */
export function setState(newState: AppState): void {
  appState = newState;
  listeners.forEach((listener) => listener(appState));
}

/**
 * Helper to update only successful dashboard state fields when current status is 'success'.
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
 * Registers a callback listener to execute when state changes.
 */
export function onStateChange(listener: StateChangeListener): void {
  listeners.push(listener);
}
