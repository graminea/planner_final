"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * SSR-safe media query hook.
 * 
 * Returns `undefined` during SSR/hydration (before first client layout),
 * then resolves to the actual match. This lets consumers avoid rendering
 * both mobile AND desktop DOM — they can show a lightweight skeleton or
 * nothing until the value resolves.
 * 
 * @param query - CSS media query string, e.g. "(min-width: 1024px)"
 */
export function useMediaQuery(query: string): boolean | undefined {
  const [matches, setMatches] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [query])

  return matches
}

/**
 * Convenience hook: returns true when viewport >= 1024px (lg breakpoint).
 * Returns undefined during SSR.
 */
export function useIsDesktop(): boolean | undefined {
  return useMediaQuery("(min-width: 1024px)")
}

/**
 * Convenience hook: returns true when viewport >= 768px (md breakpoint).
 * Returns undefined during SSR.
 */
export function useIsTablet(): boolean | undefined {
  return useMediaQuery("(min-width: 768px)")
}
