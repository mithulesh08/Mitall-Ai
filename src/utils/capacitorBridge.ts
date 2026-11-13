import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';

export interface NativePlatformInfo {
  isNative: boolean;
  platform: 'android' | 'ios' | 'web';
  isOnline: boolean;
}

export const getPlatformInfo = (): NativePlatformInfo => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  return {
    isNative,
    platform,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
};

/**
 * Initializes Native Android features when running within Capacitor
 */
export const initCapacitorBridge = (callbacks: {
  onBackButton?: () => boolean; // return true if handled
  onNetworkChange?: (connected: boolean) => void;
}) => {
  if (!Capacitor.isNativePlatform()) {
    // In web browser, set standard online/offline listeners
    window.addEventListener('online', () => callbacks.onNetworkChange?.(true));
    window.addEventListener('offline', () => callbacks.onNetworkChange?.(false));
    return () => {};
  }

  // 1. Configure Native Status Bar
  try {
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#0b0f17' }).catch(() => {});
  } catch (e) {
    console.debug('StatusBar configuration not available', e);
  }

  // 2. Configure Native Android Back Button
  const backButtonSub = CapApp.addListener('backButton', ({ canGoBack }) => {
    if (callbacks.onBackButton) {
      const handled = callbacks.onBackButton();
      if (handled) return;
    }
    if (canGoBack) {
      window.history.back();
    } else {
      CapApp.exitApp();
    }
  });

  // 3. Monitor Network Status for offline alerts
  const networkSub = Network.addListener('networkStatusChange', (status) => {
    callbacks.onNetworkChange?.(status.connected);
  });

  // 4. Configure Keyboard behavior
  try {
    Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
  } catch (e) {
    console.debug('Keyboard plugin not available', e);
  }

  return () => {
    backButtonSub.then((handle) => handle.remove()).catch(() => {});
    networkSub.then((handle) => handle.remove()).catch(() => {});
  };
};

/**
 * Native vibration trigger for button feedback
 */
export const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(15);
    } catch {}
  }
};
