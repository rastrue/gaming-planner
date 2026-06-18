-- Registration closes automatically one hour before event start.
UPDATE "events"
SET "registrationDeadline" = "scheduledStart" - INTERVAL '1 hour';
