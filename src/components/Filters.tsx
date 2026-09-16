import type { Opportunity, OpportunityStatus } from "../types/opportunity";
import {
  categoryOptions,
  categorise,
  emptyFilters,
  filterOpportunities,
  type Filters as FilterState,
} from "../lib/opportunities";
import { Icon } from "./Icon";

export function Filters({
  value,
  onChange,
  opportunities,
  status,
}: {
  value: FilterState;
  onChange: (filters: FilterState) => void;
  opportunities: Opportunity[];
  status?: OpportunityStatus;
}) {
  const locations = [
    ...new Set(opportunities.map((item) => item.location)),
  ].sort();
  const categories = categoryOptions.filter((category) =>
    opportunities.some((item) => categorise(item).includes(category)),
  );
  const count =
    Number(value.freeOnly) +
    Number(value.online) +
    Number(!!value.location) +
    value.categories.length;
  const active = count > 0;
  // Preview how many results a filter change would leave, given the current tab and
  // every other active filter — so a chip never invites a click into an empty state.
  const previewCount = (next: FilterState) =>
    filterOpportunities(opportunities, next, status).length;
  return (
    <details className="filter-disclosure">
      <summary>
        <Icon name="filter" size={17} />
        <span>Find something that suits you</span>
        <span className="filter-summary-note">
          {active
            ? `${count} filter${count === 1 ? "" : "s"} on`
            : "Optional filters"}
        </span>
        <Icon name="chevron" size={15} />
      </summary>
      <div className="filters" aria-label="Filter opportunities">
        <div className="filter-controls">
          <button
            className={`filter-chip free-filter ${value.freeOnly ? "selected" : ""} ${previewCount({ ...value, freeOnly: !value.freeOnly }) === 0 ? "zero-preview" : ""}`}
            aria-pressed={value.freeOnly}
            onClick={() => onChange({ ...value, freeOnly: !value.freeOnly })}
          >
            {value.freeOnly && <Icon name="check" size={14} />}Free only
            <span className="filter-count">({previewCount({ ...value, freeOnly: !value.freeOnly })})</span>
          </button>
          <button
            className={`filter-chip ${value.online ? "selected" : ""} ${previewCount({ ...value, online: !value.online }) === 0 ? "zero-preview" : ""}`}
            aria-pressed={value.online}
            onClick={() => onChange({ ...value, online: !value.online })}
          >
            <Icon name="globe" size={14} />
            Online
            <span className="filter-count">({previewCount({ ...value, online: !value.online })})</span>
          </button>
          <label
            className={`location-filter ${value.location ? "selected" : ""}`}
          >
            <Icon name="pin" size={14} />
            <span className="sr-only">Location</span>
            <select
              value={value.location}
              onChange={(event) =>
                onChange({ ...value, location: event.target.value })
              }
            >
              <option value="">All locations ({previewCount({ ...value, location: "" })})</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location} ({previewCount({ ...value, location })})
                </option>
              ))}
            </select>
          </label>
          <span className="filter-divider" />
          {categories.map((category) => {
            const selected = value.categories.includes(category);
            const next = selected
              ? value.categories.filter((item) => item !== category)
              : [...value.categories, category];
            const resultingCount = previewCount({ ...value, categories: next });
            return (
              <button
                key={category}
                className={`filter-chip ${selected ? "selected" : ""} ${resultingCount === 0 ? "zero-preview" : ""}`}
                aria-pressed={selected}
                onClick={() => onChange({ ...value, categories: next })}
              >
                {category}
                <span className="filter-count">({resultingCount})</span>
              </button>
            );
          })}
          {active && (
            <button
              className="clear-filter"
              onClick={() => onChange(emptyFilters)}
            >
              Clear filters
            </button>
          )}
        </div>
        {value.categories.length > 1 && (
          <p className="filter-help">
            Showing opportunities matching any selected category.
          </p>
        )}
      </div>
    </details>
  );
}
