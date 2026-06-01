import './SearchBar.scss'
import React, { useRef } from 'react'

function SearchBar({ value, onChange, onClear, placeholder, ariaLabel }) {
    const inputRef = useRef(null)

    const handleClear = () => {
        onClear()
        inputRef.current?.focus()
    }

    return (
        <div className="search-bar" role="search">
            <i className="fa-solid fa-magnifying-glass search-bar-icon" aria-hidden="true" />
            <input
                ref={inputRef}
                type="text"
                className="search-bar-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || 'Search by title, tag, or description...'}
                aria-label={ariaLabel || 'Search projects'}
            />
            {value && (
                <button
                    className="search-bar-clear"
                    onClick={handleClear}
                    aria-label="Clear search"
                    type="button"
                >
                    ×
                </button>
            )}
        </div>
    )
}

export default SearchBar
