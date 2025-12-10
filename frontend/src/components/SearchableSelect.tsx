import { useState, useEffect, useRef } from 'react';

interface Option {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number | null;
    onChange: (value: string | number) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string; // To support existing styles
}

const SearchableSelect = ({ options, value, onChange, placeholder = "Select...", disabled = false, className = "" }: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // When opening, reset search if a value is selected to the label for clarity, or clear it
    // Standard UX: clear it to allow fresh search, or select all text.
    // Let's keep it simple: clear valid search term on open if it was just displaying the value, 
    // BUT we want to show the selected value usually.
    // Approach: Display selected label when closed. Display input when open.

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (val: string | number) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`searchable-select-wrapper ${className}`} ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div
                className={`glassy-input ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: disabled ? 0.7 : 1
                }}
            >
                <span style={{
                    color: selectedOption ? 'inherit' : '#94A3B8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>▼</span>
            </div>

            {isOpen && !disabled && (
                <div className="searchable-dropdown-menu" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    zIndex: 1000,
                    background: 'var(--dash-card-bg)', // Use variable from CSS
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid var(--dash-glass-border)',
                    marginTop: '8px',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.1s ease-out'
                }}>
                    <div style={{ padding: '8px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            className="search-input-internal"
                            placeholder="Type to search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--dash-glass-border)',
                                background: 'var(--dash-bg)',
                                color: 'var(--dash-text-main)',
                                outline: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    <div className="options-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        color: 'var(--dash-text-main)',
                                        background: value === option.value ? 'var(--dash-hover)' : 'transparent',
                                        transition: 'background 0.2s',
                                        borderLeft: value === option.value ? '3px solid var(--primary)' : '3px solid transparent'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--dash-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = value === option.value ? 'var(--dash-hover)' : 'transparent'}
                                >
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--dash-text-muted)', fontSize: '0.9rem' }}>
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
