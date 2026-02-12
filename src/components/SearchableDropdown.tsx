'use client'

import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface SearchableDropdownProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchable?: boolean
  multiple?: boolean
  className?: string
  label?: string
  id?: string
  onFocus?: () => void
}

export function SearchableDropdown({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  searchable = true,
  multiple = true,
  className,
  label,
  id: providedId,
  onFocus,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const generatedId = useId()
  const baseId = providedId || generatedId
  const listboxId = `${baseId}-listbox`
  const labelId = `${baseId}-label`
  const searchId = `${baseId}-search`

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus()
    } else if (isOpen && !searchable && listboxRef.current) {
      // Focus first option if no search
      setActiveIndex(0)
    }
  }, [isOpen, searchable])

  // Reset active index when filtered options change
  useEffect(() => {
    if (isOpen && filteredOptions.length > 0) {
      setActiveIndex(0)
    } else {
      setActiveIndex(-1)
    }
  }, [search, isOpen, filteredOptions.length])

  const toggleOption = useCallback((value: string) => {
    if (multiple) {
      onChange(
        selected.includes(value)
          ? selected.filter(v => v !== value)
          : [...selected, value]
      )
    } else {
      onChange([value])
      setIsOpen(false)
      setSearch('')
      setActiveIndex(-1)
      triggerRef.current?.focus()
    }
  }, [multiple, onChange, selected])

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter(v => v !== value))
  }

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder
    if (selected.length === 1) {
      return options.find(o => o.value === selected[0])?.label || selected[0]
    }
    return `${selected.length} selected`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setIsOpen(true)
        return
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearch('')
        setActiveIndex(-1)
        triggerRef.current?.focus()
        break

      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => {
          const nextIndex = prev + 1
          return nextIndex >= filteredOptions.length ? 0 : nextIndex
        })
        break

      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => {
          const nextIndex = prev - 1
          return nextIndex < 0 ? filteredOptions.length - 1 : nextIndex
        })
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          toggleOption(filteredOptions[activeIndex].value)
        }
        break

      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break

      case 'End':
        e.preventDefault()
        setActiveIndex(filteredOptions.length - 1)
        break

      case 'Tab':
        setIsOpen(false)
        setSearch('')
        setActiveIndex(-1)
        break
    }
  }

  // Scroll active option into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listboxRef.current) {
      const activeOption = listboxRef.current.querySelector(`[data-index="${activeIndex}"]`)
      activeOption?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, isOpen])

  const activeOptionId = activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label id={labelId} className="block text-xs font-medium text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-labelledby={label ? labelId : undefined}
        aria-activedescendant={activeOptionId}
        onClick={() => {
          if (!isOpen && onFocus) {
            onFocus()
          }
          setIsOpen(!isOpen)
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border bg-background text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          isOpen ? 'border-foreground/30 ring-1 ring-foreground/10' : 'hover:border-foreground/20',
          selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown
          className={cn('w-4 h-4 flex-shrink-0 transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-background rounded-lg border shadow-lg overflow-hidden"
          role="presentation"
        >
          {searchable && (
            <div className="p-2 border-b">
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  id={searchId}
                  type="text"
                  role="searchbox"
                  aria-label="Search options"
                  aria-controls={listboxId}
                  aria-activedescendant={activeOptionId}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-md outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label={label || placeholder}
            aria-multiselectable={multiple}
            className="max-h-48 overflow-y-auto"
            tabIndex={-1}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = selected.includes(opt.value)
                const isActive = index === activeIndex

                return (
                  <button
                    key={opt.value}
                    id={`${baseId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-index={index}
                    onClick={() => toggleOption(opt.value)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                      'focus:outline-none',
                      isActive && 'bg-muted',
                      isSelected && !isActive && 'bg-muted/50'
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-foreground" aria-hidden="true" />
                    )}
                  </button>
                )
              })
            ) : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground" role="status">
                No results found
              </div>
            )}
          </div>

          {multiple && selected.length > 0 && (
            <div className="p-2 border-t bg-muted/30">
              <div className="flex flex-wrap gap-1" role="list" aria-label="Selected options">
                {selected.map(value => {
                  const opt = options.find(o => o.value === value)
                  return (
                    <span
                      key={value}
                      role="listitem"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/10 text-xs"
                    >
                      {opt?.label || value}
                      <button
                        type="button"
                        onClick={e => removeOption(value, e)}
                        aria-label={`Remove ${opt?.label || value}`}
                        className="hover:text-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring rounded"
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
