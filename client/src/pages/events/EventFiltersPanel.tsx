import Accordion from '../../components/ui/Accordion';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import SearchBar from '../../components/ui/SearchBar';
import SelectDropdown from '../../components/ui/SelectDropdown';
import TextInput from '../../components/ui/TextInput';
import { eventStatusLabels } from '../../i18n/labels';
import type { EventsFilterState } from '../../store/filtersSlice';
import type { EventStatus, Game } from '../../types/index';

const statusOptions: Array<{ value: EventStatus; label: string }> = (
  Object.entries(eventStatusLabels) as Array<[EventStatus, string]>
).map(([value, label]) => ({ value, label }));

const sortOptions = [
  { value: 'scheduledStart', label: 'Время начала' },
  { value: 'title', label: 'Название' },
  { value: 'createdAt', label: 'Дата создания' },
  { value: 'status', label: 'Статус' },
];

const orderOptions = [
  { value: 'asc', label: 'По возрастанию' },
  { value: 'desc', label: 'По убыванию' },
];

const pageSizeOptions = [
  { value: '10', label: '10 на странице' },
  { value: '20', label: '20 на странице' },
  { value: '50', label: '50 на странице' },
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
          Поиск и фильтры
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Сбросить фильтры
        </Button>
      </div>

      <SearchBar
        label="Поиск событий"
        placeholder="Поиск по названию или описанию..."
        value={filters.search}
        onChange={(value) => onFiltersChange({ search: value, page: 1 })}
        onSearch={(value) => onFiltersChange({ search: value, page: 1 })}
        onReset={() => onFiltersChange({ search: '', page: 1 })}
      />

      <Accordion
        defaultOpenIds={['filters']}
        items={[
          {
            id: 'filters',
            title: 'Параметры фильтрации и сортировки',
            content: (
              <div className="space-y-4 pt-2">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <SelectDropdown
                    label="Игра"
                    value={filters.gameId?.toString() ?? ''}
                    onChange={(event) =>
                      onFiltersChange({
                        gameId: event.target.value ? Number(event.target.value) : null,
                        page: 1,
                      })
                    }
                    options={[
                      { value: '', label: 'Все игры' },
                      ...games.map((game) => ({ value: String(game.id), label: game.title })),
                    ]}
                  />
                  <SelectDropdown
                    label="Статус"
                    value={filters.status ?? ''}
                    onChange={(event) =>
                      onFiltersChange({
                        status: (event.target.value as EventStatus) || null,
                        page: 1,
                      })
                    }
                    options={[
                      { value: '', label: 'Все статусы' },
                      ...statusOptions.map((option) => ({ value: option.value, label: option.label })),
                    ]}
                  />
                  <SelectDropdown
                    label="Сортировка"
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
                    label="Порядок"
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
                    label="Дата начала"
                    type="date"
                    value={filters.startDate}
                    onChange={(event) => onFiltersChange({ startDate: event.target.value, page: 1 })}
                  />
                  <TextInput
                    label="Дата окончания"
                    type="date"
                    value={filters.endDate}
                    onChange={(event) => onFiltersChange({ endDate: event.target.value, page: 1 })}
                  />
                  <SelectDropdown
                    label="Размер страницы"
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
                    label="Показывать только события, подходящие по моей доступности"
                    checked={filters.availabilityFit}
                    onChange={(event) =>
                      onFiltersChange({
                        availabilityFit: event.target.checked,
                        page: 1,
                      })
                    }
                  />
                ) : null}
              </div>
            ),
          },
        ]}
      />
    </section>
  );
}
