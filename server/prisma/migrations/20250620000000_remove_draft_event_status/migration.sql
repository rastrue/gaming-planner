-- Remove DRAFT status; events are created directly in REGISTRATION.
UPDATE "Event"
SET "status" = 'REGISTRATION'
WHERE "status" = 'DRAFT';

CREATE TYPE "EventStatus_new" AS ENUM (
  'REGISTRATION',
  'FULL',
  'WAITING',
  'STARTED',
  'COMPLETED',
  'CANCELLED'
);

ALTER TABLE "Event"
ALTER COLUMN "status" TYPE "EventStatus_new"
USING ("status"::text::"EventStatus_new");

DROP TYPE "EventStatus";
ALTER TYPE "EventStatus_new" RENAME TO "EventStatus";
