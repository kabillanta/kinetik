"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  Calendar,
  MapPin,
  Tag,
  SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterState } from "@/lib/hooks/useFilters";

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  
  // Feature flags
  showSearch?: boolean;
  showStatus?: boolean;
  showDateRange?: boolean;
  showLocation?: boolean;
  showSkills?: boolean;
  showSort?: boolean;
  
  // Options
  statusOptions?: { value: string; label: string }[];
  skillOptions?: string[];
  sortOptions?: { value: string; label: string }[];
  
  // Search
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  searchValue?: string;
  isSearching?: boolean;
}

const defaultStatusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const defaultSortOptions = [
  { value: "date_asc", label: "Date (Oldest)" },
  { value: "date_desc", label: "Date (Newest)" },
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
];

export function FilterBar({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount,
  showSearch = true,
  showStatus = true,
  showDateRange = false,
  showLocation = false,
  showSkills = false,
  showSort = true,
  statusOptions = defaultStatusOptions,
  skillOptions = [],
  sortOptions = defaultSortOptions,
  searchPlaceholder = "Search...",
  onSearchChange,
  searchValue = "",
  isSearching = false,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
      {/* Main filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        {showSearch && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Quick filters */}
        {showStatus && (
          <FilterDropdown
            label="Status"
            icon={<Tag className="w-4 h-4" />}
            value={filters.status}
            options={statusOptions}
            onChange={(value) => onFilterChange({ status: value })}
          />
        )}

        {showSort && (
          <FilterDropdown
            label="Sort"
            icon={<SlidersHorizontal className="w-4 h-4" />}
            value={filters.sortBy}
            options={sortOptions}
            onChange={(value) => {
              if (value) {
                const [field, order] = value.split("_");
                onFilterChange({ 
                  sortBy: field, 
                  sortOrder: order as "asc" | "desc" 
                });
              } else {
                onFilterChange({ sortBy: undefined, sortOrder: undefined });
              }
            }}
          />
        )}

        {/* More filters toggle */}
        {(showDateRange || showLocation || showSkills) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors",
              isExpanded
                ? "bg-purple-50 border-purple-200 text-purple-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4" />
            More Filters
            <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
          </button>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          {showDateRange && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateRange?.start || ""}
                  onChange={(e) => 
                    onFilterChange({ 
                      dateRange: { 
                        start: e.target.value, 
                        end: filters.dateRange?.end || "" 
                      } 
                    })
                  }
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="date"
                  value={filters.dateRange?.end || ""}
                  onChange={(e) => 
                    onFilterChange({ 
                      dateRange: { 
                        start: filters.dateRange?.start || "", 
                        end: e.target.value 
                      } 
                    })
                  }
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {showLocation && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <input
                type="text"
                value={filters.location || ""}
                onChange={(e) => onFilterChange({ location: e.target.value })}
                placeholder="Enter location..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {showSkills && skillOptions.length > 0 && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Tag className="w-4 h-4" />
                Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {skillOptions.slice(0, 6).map((skill) => {
                  const isSelected = filters.skills?.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => {
                        const newSkills = isSelected
                          ? (filters.skills || []).filter((s) => s !== skill)
                          : [...(filters.skills || []), skill];
                        onFilterChange({ skills: newSkills.length ? newSkills : undefined });
                      }}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-full border transition-colors",
                        isSelected
                          ? "bg-purple-100 border-purple-300 text-purple-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active filters tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.status && (
            <FilterTag
              label={`Status: ${filters.status}`}
              onRemove={() => onFilterChange({ status: undefined })}
            />
          )}
          {filters.location && (
            <FilterTag
              label={`Location: ${filters.location}`}
              onRemove={() => onFilterChange({ location: undefined })}
            />
          )}
          {filters.dateRange && (
            <FilterTag
              label={`${filters.dateRange.start} - ${filters.dateRange.end}`}
              onRemove={() => onFilterChange({ dateRange: undefined })}
            />
          )}
          {filters.skills?.map((skill) => (
            <FilterTag
              key={skill}
              label={skill}
              onRemove={() => 
                onFilterChange({ 
                  skills: filters.skills?.filter((s) => s !== skill) 
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Dropdown component
interface FilterDropdownProps {
  label: string;
  icon?: React.ReactNode;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}

function FilterDropdown({ label, icon, value, options, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors",
          value
            ? "bg-purple-50 border-purple-200 text-purple-700"
            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
        )}
      >
        {icon}
        {selectedOption?.label || label}
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1">
            <button
              onClick={() => {
                onChange(undefined);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
            >
              All
            </button>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-gray-50",
                  value === option.value && "bg-purple-50 text-purple-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Filter tag component
interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export default FilterBar;
