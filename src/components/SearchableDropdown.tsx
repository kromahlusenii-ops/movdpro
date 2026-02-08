'use client'

import { useState, useRef, useEffect } from 'react'
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
}

export function SearchableDropdown({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  searchable = true,
  multiple = true,
  className,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, searchable])

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const toggleOption = (value: string) => {
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
    }
  }

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

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border bg-background text-sm transition-colors',
          isOpen ? 'border-foreground/30 ring-1 ring-foreground/10' : 'hover:border-foreground/20',
          selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background rounded-lg border shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-md outline-none"
                />
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleOption(opt.value)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors',
                    selected.includes(opt.value) && 'bg-muted/50'
                  )}
                >
                  <span>{opt.label}</span>
                  {selected.includes(opt.value) && (
                    <Check className="w-4 h-4 text-foreground" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </div>

          {multiple && selected.length > 0 && (
            <div className="p-2 border-t bg-muted/30">
              <div className="flex flex-wrap gap-1">
                {selected.map(value => {
                  const opt = options.find(o => o.value === value)
                  return (
                    <span
                      key={value}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/10 text-xs"
                    >
                      {opt?.label || value}
                      <button
                        type="button"
                        onClick={e => removeOption(value, e)}
                        className="hover:text-foreground/70"
                      >
                        <X className="w-3 h-3" />
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
