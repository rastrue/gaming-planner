import type { DragEvent } from 'react';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { formatAttendanceStatus } from '../../utils/labels';
import { cn } from '../../utils/cn';
import type { AttendanceStatus, EventSlot, Registration } from '../../types/index';

export const REGISTRATION_DRAG_TYPE = 'application/questsync-registration-id';

export interface PlayerAssignmentCardProps {
  registration: Registration;
  draggable?: boolean;
  onDragStart?: (registrationId: number, event: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export function PlayerAssignmentCard({
  registration,
  draggable = false,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: PlayerAssignmentCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={(event) => onDragStart?.(registration.id, event)}
      onDragEnd={onDragEnd}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
    >
      <Avatar name={registration.user.displayName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
          {registration.user.displayName}
        </p>
        {registration.requestedRoleName ? (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            Requested: {registration.requestedRoleName}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function attendanceVariant(status: AttendanceStatus) {
  switch (status) {
    case 'PRESENT':
      return 'success';
    case 'ABSENT':
      return 'danger';
    default:
      return 'default';
  }
}

export interface RosterSlotColumnProps {
  slot: EventSlot;
  assignments: Registration[];
  canAcceptDrop?: boolean;
  isDragOver: boolean;
  canMarkAttendance: boolean;
  readOnly?: boolean;
  busyRegistrationId: number | null;
  draggingRegistrationId: number | null;
  onDragStart: (registrationId: number, event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onMarkAttendance: (registration: Registration, status: AttendanceStatus) => void;
}

export default function RosterSlotColumn({
  slot,
  assignments,
  canAcceptDrop = true,
  isDragOver,
  canMarkAttendance,
  readOnly = false,
  busyRegistrationId,
  draggingRegistrationId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onMarkAttendance,
}: RosterSlotColumnProps) {
  const fillCount = assignments.length;
  const isFull = fillCount >= slot.requiredCount;
  const isOverfull = fillCount > slot.requiredCount;

  return (
    <article className="flex min-h-64 flex-col rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{slot.roleName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Order {slot.displayOrder}</p>
          </div>
          <Badge variant={isOverfull ? 'danger' : isFull ? 'success' : 'warning'}>
            {fillCount} / {slot.requiredCount}
          </Badge>
        </div>
      </header>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'flex flex-1 flex-col gap-2 p-3 transition-colors',
          isDragOver && canAcceptDrop && 'bg-primary-50 ring-2 ring-inset ring-primary-400 dark:bg-primary-950/40',
          isFull && !canAcceptDrop && 'opacity-90',
        )}
      >
        {assignments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {isFull ? 'Slot full' : readOnly ? 'No assignments' : 'Drag approved players here'}
          </p>
        ) : (
          assignments.map((registration) => (
            <div key={registration.id} className="space-y-2">
              <PlayerAssignmentCard
                registration={registration}
                draggable={!readOnly}
                onDragStart={readOnly ? undefined : onDragStart}
                onDragEnd={readOnly ? undefined : onDragEnd}
                isDragging={draggingRegistrationId === registration.id}
              />
              {canMarkAttendance ? (
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <Badge variant={attendanceVariant(registration.attendanceStatus)}>
                    {formatAttendanceStatus(registration.attendanceStatus)}
                  </Badge>
                  <button
                    type="button"
                    disabled={busyRegistrationId === registration.id}
                    onClick={() => void onMarkAttendance(registration, 'PRESENT')}
                    className="cursor-pointer rounded-md border border-emerald-300 px-2 py-0.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    disabled={busyRegistrationId === registration.id}
                    onClick={() => void onMarkAttendance(registration, 'ABSENT')}
                    className="cursor-pointer rounded-md border border-red-300 px-2 py-0.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                  >
                    Absent
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </article>
  );
}
