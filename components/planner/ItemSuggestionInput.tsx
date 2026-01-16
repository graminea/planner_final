"use client"

import type React from "react"

/**
 * ItemSuggestionInput - Autocomplete with styled dropdown
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { Loader2 } from "lucide-react"
import { searchSuggestions, incrementSuggestionUsage } from "@/app/actions/suggestions"
import type { ItemSuggestion } from "@/app/actions/suggestions"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
  placeholder = "Buscar ou adicionar item...",
}: ItemSuggestionInputProps) {
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

    const timer = setTimeout(fetchSuggestions, 200)
    return () => clearTimeout(timer)
  }, [value])

  const handleSelect = useCallback(
    async (suggestion: ItemSuggestion) => {
      onChange(suggestion.name)
      setShowDropdown(false)
      await incrementSuggestionUsage(suggestion.id)
      onSelectSuggestion?.(suggestion)
    },
    [onChange, onSelectSuggestion],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setShowDropdown(false)
        break
    }
  }

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

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <Input
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
        className="pr-8"
      />

      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
      )}

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-[200px] overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                "w-full px-3 py-2 text-left flex items-center justify-between transition-colors",
                index === selectedIndex ? "bg-muted" : "hover:bg-muted/50",
              )}
            >
              <span className="text-sm text-foreground">{suggestion.name}</span>
              {suggestion.categoryName && (
                <span className="text-xs text-muted-foreground">{suggestion.categoryName}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {showDropdown && value.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm text-muted-foreground">Nenhuma sugestão. Pressione Enter para adicionar "{value}"</p>
        </div>
      )}
    </div>
  )
}
