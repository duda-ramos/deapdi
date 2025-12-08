import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description?: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

/**
 * Hook for managing global keyboard shortcuts with proper accessibility support.
 * 
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 'k', ctrlOrCmd: true, callback: () => openSearch(), description: 'Open search' },
 *     { key: 'n', ctrlOrCmd: true, callback: () => newTask(), description: 'New task' },
 *     { key: 'Escape', callback: () => closeModal(), description: 'Close modal' },
 *   ]
 * });
 */
export const useKeyboardShortcuts = ({
  enabled = true,
  shortcuts,
}: UseKeyboardShortcutsOptions): void => {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in an input/textarea
    const target = event.target as HTMLElement;
    const isTyping = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable;

    // Check for Ctrl/Cmd key (Cmd on Mac, Ctrl on Windows/Linux)
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

    for (const shortcut of shortcutsRef.current) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlOrCmdMatch = shortcut.ctrlOrCmd ? ctrlOrCmd : !ctrlOrCmd;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      // Skip if shortcut requires no modifiers but user is typing (except Escape)
      if (isTyping && !shortcut.ctrlOrCmd && shortcut.key !== 'Escape') {
        continue;
      }

      if (keyMatch && ctrlOrCmdMatch && shiftMatch && altMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
          event.stopPropagation();
        }
        shortcut.callback();
        return;
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};

/**
 * Hook for keyboard navigation in lists (Arrow Up/Down, Home/End).
 */
interface UseListNavigationOptions {
  itemCount: number;
  onSelect?: (index: number) => void;
  onActivate?: (index: number) => void;
  enabled?: boolean;
  loop?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

interface UseListNavigationReturn {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  getItemProps: (index: number) => {
    tabIndex: number;
    'aria-selected': boolean;
    onKeyDown: (event: React.KeyboardEvent) => void;
    onClick: () => void;
    onFocus: () => void;
  };
  listProps: {
    role: string;
    'aria-activedescendant'?: string;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
}

export const useListNavigation = ({
  itemCount,
  onSelect,
  onActivate,
  enabled = true,
  loop = true,
  orientation = 'vertical',
}: UseListNavigationOptions): UseListNavigationReturn => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const navigate = useCallback((direction: 1 | -1) => {
    setActiveIndex((current) => {
      let nextIndex = current + direction;
      
      if (loop) {
        if (nextIndex < 0) nextIndex = itemCount - 1;
        if (nextIndex >= itemCount) nextIndex = 0;
      } else {
        nextIndex = Math.max(0, Math.min(itemCount - 1, nextIndex));
      }

      return nextIndex;
    });
  }, [itemCount, loop]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enabled || itemCount === 0) return;

    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';

    switch (event.key) {
      case prevKey:
        event.preventDefault();
        navigate(-1);
        break;
      case nextKey:
        event.preventDefault();
        navigate(1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(itemCount - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onActivate?.(activeIndex);
        break;
      default:
        break;
    }
  }, [enabled, itemCount, orientation, navigate, activeIndex, onActivate]);

  const getItemProps = useCallback((index: number) => ({
    tabIndex: index === activeIndex ? 0 : -1,
    'aria-selected': index === activeIndex,
    onKeyDown: handleKeyDown,
    onClick: () => {
      setActiveIndex(index);
      onSelect?.(index);
    },
    onFocus: () => setActiveIndex(index),
  }), [activeIndex, handleKeyDown, onSelect]);

  const listProps = {
    role: 'listbox',
    'aria-activedescendant': activeIndex >= 0 ? `item-${activeIndex}` : undefined,
    onKeyDown: handleKeyDown,
  };

  return {
    activeIndex,
    setActiveIndex,
    getItemProps,
    listProps,
  };
};

// Import React for useState
import React from 'react';

/**
 * Hook for focus trap - keeps focus within a container (for modals, dialogs).
 */
interface UseFocusTrapOptions {
  enabled?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  returnFocus?: boolean;
}

export const useFocusTrap = (
  containerRef: React.RefObject<HTMLElement>,
  { enabled = true, initialFocus, returnFocus = true }: UseFocusTrapOptions = {}
): void => {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Store the currently focused element to restore later
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = () => {
      if (!containerRef.current) return [];
      
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
      ].join(',');

      return Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => el.offsetParent !== null); // Filter out hidden elements
    };

    // Focus the initial element or the first focusable element
    const focusFirst = () => {
      if (initialFocus?.current) {
        initialFocus.current.focus();
      } else {
        const focusables = getFocusableElements();
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          containerRef.current?.focus();
        }
      }
    };

    // Handle tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusables = getFocusableElements();
      if (focusables.length === 0) return;

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: if on first element, go to last
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    // Set initial focus after a brief delay (to allow animations)
    const timer = setTimeout(focusFirst, 50);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus to the previously focused element
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [enabled, containerRef, initialFocus, returnFocus]);
};

/**
 * Hook for roving tabindex pattern in tab lists.
 */
interface UseRovingTabIndexOptions {
  itemCount: number;
  orientation?: 'horizontal' | 'vertical';
  onSelect?: (index: number) => void;
}

interface UseRovingTabIndexReturn {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  getTabProps: (index: number) => {
    tabIndex: number;
    'aria-selected': boolean;
    role: string;
    onKeyDown: (event: React.KeyboardEvent) => void;
    onClick: () => void;
  };
}

export const useRovingTabIndex = ({
  itemCount,
  orientation = 'horizontal',
  onSelect,
}: UseRovingTabIndexOptions): UseRovingTabIndexReturn => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

    let nextIndex = activeIndex;

    switch (event.key) {
      case prevKey:
        event.preventDefault();
        nextIndex = activeIndex === 0 ? itemCount - 1 : activeIndex - 1;
        break;
      case nextKey:
        event.preventDefault();
        nextIndex = activeIndex === itemCount - 1 ? 0 : activeIndex + 1;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = itemCount - 1;
        break;
      default:
        return;
    }

    setActiveIndex(nextIndex);
    onSelect?.(nextIndex);
  }, [activeIndex, itemCount, orientation, onSelect]);

  const getTabProps = useCallback((index: number) => ({
    tabIndex: index === activeIndex ? 0 : -1,
    'aria-selected': index === activeIndex,
    role: 'tab',
    onKeyDown: handleKeyDown,
    onClick: () => {
      setActiveIndex(index);
      onSelect?.(index);
    },
  }), [activeIndex, handleKeyDown, onSelect]);

  return {
    activeIndex,
    setActiveIndex,
    getTabProps,
  };
};
