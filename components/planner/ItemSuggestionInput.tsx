'use client'

/**
 * ItemSuggestionInput - Autocomplete for item names
 * 
 * MINIMAL UI - Intentionally unstyled for v0 redesign
 * 
 * Features:
 * - Autocomplete suggestions as user types
 * - Shows category and icon for each suggestion
 * - Allows custom entries
 * - Persists custom suggestions
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { searchSuggestions, createSuggestion, incrementSuggestionUsage } from '@/app/actions/suggestions'
import type { ItemSuggestion } from '@/app/actions/suggestions'

interface ItemSuggestionInputProps {
  value: string
  onChange: (value: string) => void
  onSelectSuggestion?: (suggestion: ItemSuggestion) => void
  placeholder?: string
}

export function ItemSuggestionInput({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = 'Search or add item...'
}: ItemSuggestionInputProps) {
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions when value changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      const results = await searchSuggestions(value, 8)
      setSuggestions(results)
      setIsLoading(false)
      setSelectedIndex(-1)
    }

    // Debounce
    const timer = setTimeout(fetchSuggestions, 200)
    return () => clearTimeout(timer)
  }, [value])

  // Handle selection
  const handleSelect = useCallback(async (suggestion: ItemSuggestion) => {
    onChange(suggestion.name)
    setShowDropdown(false)
    
    // Track usage
    await incrementSuggestionUsage(suggestion.id)
    
    // Notify parent
    onSelectSuggestion?.(suggestion)
  }, [onChange, onSelectSuggestion])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        break
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setShowDropdown(true)
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px' }}
      />

      {/* Loading indicator */}
      {isLoading && (
        <span style={{ position: 'absolute', right: '8px', top: '8px' }}>...</span>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 100
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              style={{
                padding: '8px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? '#f0f0f0' : 'white',
                borderBottom: '1px solid #eee'
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {suggestion.name}
                </span>
                {suggestion.categoryName && (
                  <span style={{ color: '#888', fontSize: '12px' }}>
                    {suggestion.categoryName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results hint */}
      {showDropdown && value.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            padding: '8px',
            color: '#888'
          }}
        >
          No suggestions. Press Enter to add "{value}"
        </div>
      )}
    </div>
  )
}
