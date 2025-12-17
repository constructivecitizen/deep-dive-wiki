import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * Centralized navigation state management hook.
 * 
 * This hook solves several problems:
 * 1. Race conditions from async state updates
 * 2. Stale closures in callbacks passed to child components
 * 3. Inconsistent state between document path and section selection
 * 
 * Key design decisions:
 * - Uses refs alongside state to provide immediate access to current values
 * - All state changes are atomic (document + section updated together)
 * - Provides stable callback references that always read current state
 */

export interface NavigationState {
  documentPath: string | null;
  sectionId: string | null;
  sectionTitle: string | null;
  sectionView: SectionViewData | null;
}

export interface SectionViewData {
  content: string;
  title: string;
  level: number;
  parentPath: string;
  sectionHierarchy: Array<{ title: string; level: number }>;
}

interface NavigationActions {
  navigateToDocument: (path: string) => void;
  navigateToSection: (
    documentPath: string,
    sectionId: string,
    sectionTitle: string,
    viewData: SectionViewData
  ) => void;
  clearSection: () => void;
  isAtDocument: (path: string) => boolean;
  isAtSection: (path: string, sectionId: string) => boolean;
  isDocumentActive: (path: string) => boolean;
}

export type NavigationContextValue = NavigationState & NavigationActions;

const initialState: NavigationState = {
  documentPath: null,
  sectionId: null,
  sectionTitle: null,
  sectionView: null,
};

export function useNavigationState(): NavigationContextValue {
  const [state, setState] = useState<NavigationState>(initialState);
  
  // Ref always contains current state - solves stale closure problem
  const stateRef = useRef<NavigationState>(state);
  stateRef.current = state;

  /**
   * Navigate to a document root, clearing any section selection.
   * This is the primary action when clicking a folder/document in the sidebar.
   */
  const navigateToDocument = useCallback((path: string) => {
    const current = stateRef.current;
    
    // Skip if already at this document root
    if (current.documentPath === path && !current.sectionId) {
      return;
    }
    
    setState({
      documentPath: path,
      sectionId: null,
      sectionTitle: null,
      sectionView: null,
    });
  }, []);

  /**
   * Navigate to a specific section within a document.
   * Atomically updates both document path and section info.
   */
  const navigateToSection = useCallback((
    documentPath: string,
    sectionId: string,
    sectionTitle: string,
    viewData: SectionViewData
  ) => {
    const current = stateRef.current;
    
    // Skip if already at this exact section
    if (
      current.documentPath === documentPath &&
      current.sectionId === sectionId
    ) {
      return;
    }
    
    setState({
      documentPath,
      sectionId,
      sectionTitle,
      sectionView: viewData,
    });
  }, []);

  /**
   * Clear section selection while staying on current document.
   * Used when clicking the document root while viewing a section.
   */
  const clearSection = useCallback(() => {
    const current = stateRef.current;
    
    // Only update if there's actually a section to clear
    if (!current.sectionId) {
      return;
    }
    
    setState(prev => ({
      ...prev,
      sectionId: null,
      sectionTitle: null,
      sectionView: null,
    }));
  }, []);

  /**
   * Check if currently at a document root (no section selected).
   * Uses ref for immediate/synchronous check.
   */
  const isAtDocument = useCallback((path: string): boolean => {
    const current = stateRef.current;
    return current.documentPath === path && !current.sectionId;
  }, []);

  /**
   * Check if currently at a specific section.
   * Uses ref for immediate/synchronous check.
   */
  const isAtSection = useCallback((path: string, sectionId: string): boolean => {
    const current = stateRef.current;
    return current.documentPath === path && current.sectionId === sectionId;
  }, []);

  /**
   * Check if a document is active (either at root or viewing a section within it).
   * Useful for sidebar highlighting of parent documents.
   */
  const isDocumentActive = useCallback((path: string): boolean => {
    const current = stateRef.current;
    return current.documentPath === path;
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    ...state,
    navigateToDocument,
    navigateToSection,
    clearSection,
    isAtDocument,
    isAtSection,
    isDocumentActive,
  }), [
    state,
    navigateToDocument,
    navigateToSection,
    clearSection,
    isAtDocument,
    isAtSection,
    isDocumentActive,
  ]);
}
