"use client";

import React from "react";
import { Search } from "lucide-react";
// Local, narrow types to align with page.tsx usage
type ReadFilter = "all" | "unread" | "read";
type TypeFilter = string; // keep broad to accept page values
type SortOrder = "newest" | "oldest";

interface InboxFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  readFilter: ReadFilter;
  onReadFilterChange: (value: ReadFilter) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
}

/**
 * InboxFilters Component
 * Search bar and filter dropdowns for the inbox
 */
export function InboxFilters({
  searchTerm,
  onSearchChange,
  readFilter,
  onReadFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortOrder,
  onSortOrderChange,
}: InboxFiltersProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Suchen..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Ereignisse suchen"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Read/Unread Filter */}
        <div>
          <label htmlFor="read-filter" className="block text-sm font-medium mb-1.5">
            Status
          </label>
          <select
            id="read-filter"
            value={readFilter}
            onChange={(e) => onReadFilterChange(e.target.value as ReadFilter)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="all">Alle</option>
            <option value="unread">Ungelesen</option>
            <option value="read">Gelesen</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium mb-1.5">
            Typ
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as TypeFilter)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="alle">Alle</option>
            <option value="urlaub">Urlaub</option>
            <option value="tagesbefreiung">Tagesbefreiung</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label htmlFor="sort-order" className="block text-sm font-medium mb-1.5">
            Sortierung
          </label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as SortOrder)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="neueste">Neueste zuerst</option>
            <option value="aelteste">Älteste zuerst</option>
          </select>
        </div>
      </div>
    </div>
  );
}

