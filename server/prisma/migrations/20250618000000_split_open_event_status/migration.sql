-- Replace OPEN/CLOSED with REGISTRATION, WAITING, and STARTED lifecycle statuses.
CREATE TYPE "EventStatus_new" AS ENUM (
  'DRAFT',
  'REGISTRATION',
  'FULL',
  'WAITING',
  'STARTED',
  'COMPLETED',
  'CANCELLED'
);

ALTER TABLE "Event"
ALTER COLUMN "status" TYPE "EventStatus_new"
USING (
  CASE
    WHEN "status"::text = 'OPEN' AND "scheduledStart" <= NOW() THEN 'STARTED'
    WHEN "status"::text = 'OPEN' AND "registrationDeadline" < NOW() THEN 'WAITING'
    WHEN "status"::text = 'OPEN' THEN 'REGISTRATION'
    WHEN "status"::text = 'CLOSED' AND "scheduledStart" <= NOW() THEN 'STARTED'
    WHEN "status"::text = 'CLOSED' THEN 'WAITING'
    ELSE "status"::text
  END
)::"EventStatus_new";

DROP TYPE "EventStatus";
ALTER TYPE "EventStatus_new" RENAME TO "EventStatus";
