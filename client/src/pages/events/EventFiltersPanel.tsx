import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import SearchBar from '../../components/ui/SearchBar';
import SelectDropdown from '../../components/ui/SelectDropdown';
import TextInput from '../../components/ui/TextInput';
import type { EventsFilterState } from '../../store/filtersSlice';
import type { EventStatus, Game } from '../../types/index';

const statusOptions: Array<{ value: EventStatus; label: string }> = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'FULL', label: 'Full' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const sortOptions = [
  { value: 'scheduledStart', label: 'Start time' },
  { value: 'title', label: 'Title' },
  { value: 'createdAt', label: 'Created date' },
  { value: 'status', label: 'Status' },
];

const orderOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

const pageSizeOptions = [
  { value: '10', label: '10 per page' },
  { value: '20', label: '20 per page' },
  { value: '50', label: '50 per page' },
];

export interface EventFiltersPanelProps {
  filters: EventsFilterState;
  games: Game[];
  showAvailabilityFit: boolean;
  onFiltersChange: (patch: Partial<EventsFilterState>) => void;
  onReset: () => void;
}

export default function EventFiltersPanel({
  filters,
  games,
  showAvailabilityFit,
  onFiltersChange,
  onReset,
}: EventFiltersPanelProps) {
  return (
    <section
      aria-labelledby="event-filters-heading"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="event-filters-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Search and filters
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Reset filters
        </Button>
      </div>

      <SearchBar
        label="Search events"
        placeholder="Search by title or description..."
        value={filters.search}
        onChange={(value) => onFiltersChange({ search: value, page: 1 })}
        onSearch={(value) => onFiltersChange({ search: value, page: 1 })}
        onReset={() => onFiltersChange({ search: '', page: 1 })}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SelectDropdown
          label="Game"
          value={filters.gameId?.toString() ?? ''}
          onChange={(event) =>
            onFiltersChange({
              gameId: event.target.value ? Number(event.target.value) : null,
              page: 1,
            })
          }
          placeholder="All games"
          options={games.map((game) => ({ value: String(game.id), label: game.title }))}
        />
        <SelectDropdown
          label="Status"
          value={filters.status ?? ''}
          onChange={(event) =>
            onFiltersChange({
              status: (event.target.value as EventStatus) || null,
              page: 1,
            })
          }
          placeholder="All statuses"
          options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
        />
        <SelectDropdown
          label="Sort by"
          value={filters.sort}
          onChange={(event) =>
            onFiltersChange({
              sort: event.target.value as EventsFilterState['sort'],
              page: 1,
            })
          }
          options={sortOptions}
        />
        <SelectDropdown
          label="Sort order"
          value={filters.order}
          onChange={(event) =>
            onFiltersChange({
              order: event.target.value as EventsFilterState['order'],
              page: 1,
            })
          }
          options={orderOptions}
        />
        <TextInput
          label="Start date"
          type="date"
          value={filters.startDate}
          onChange={(event) => onFiltersChange({ startDate: event.target.value, page: 1 })}
        />
        <TextInput
          label="End date"
          type="date"
          value={filters.endDate}
          onChange={(event) => onFiltersChange({ endDate: event.target.value, page: 1 })}
        />
        <SelectDropdown
          label="Page size"
          value={String(filters.pageSize)}
          onChange={(event) =>
            onFiltersChange({
              pageSize: Number(event.target.value),
              page: 1,
            })
          }
          options={pageSizeOptions}
        />
      </div>

      {showAvailabilityFit ? (
        <Checkbox
          label="Only show events that fit my availability"
          checked={filters.availabilityFit}
          onChange={(event) =>
            onFiltersChange({
              availabilityFit: event.target.checked,
              page: 1,
            })
          }
        />
      ) : null}
    </section>
  );
}
