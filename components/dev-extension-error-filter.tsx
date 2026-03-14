'use client';

import { useEffect } from 'react';

function isExtensionError(value: unknown): boolean {
  if (!value) {
    return false;
  }

  if (typeof value === 'string') {
    return value.includes('chrome-extension://') || value.includes('moz-extension://');
  }

  if (value instanceof Error) {
    const stack = value.stack || '';
    const message = value.message || '';
    return (
      stack.includes('chrome-extension://') ||
      stack.includes('moz-extension://') ||
      message.includes('MetaMask')
    );
  }

  if (typeof value === 'object') {
    const maybeMessage = 'message' in value ? String((value as { message?: unknown }).message ?? '') : '';
    const maybeStack = 'stack' in value ? String((value as { stack?: unknown }).stack ?? '') : '';

    return (
      maybeStack.includes('chrome-extension://') ||
      maybeStack.includes('moz-extension://') ||
      maybeMessage.includes('MetaMask') ||
      maybeMessage.includes('chrome-extension://') ||
      maybeMessage.includes('moz-extension://')
    );
  }

  return false;
}

export function DevExtensionErrorFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const onError = (event: ErrorEvent) => {
      const fromExtension =
        isExtensionError(event.error) ||
        isExtensionError(event.filename) ||
        isExtensionError(event.message);

      if (!fromExtension) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isExtensionError(event.reason)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    };

    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onUnhandledRejection, true);

    return () => {
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onUnhandledRejection, true);
    };
  }, []);

  return null;
}
