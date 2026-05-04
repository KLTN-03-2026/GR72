# Backend modules

The old `src/Api` tree was removed because it followed the previous expert-first business flow.

New modules should be rebuilt around the package-first domains:

- `auth`: login, register, current session.
- `packages`: service packages, purchased packages, package-expert mapping.
- `experts`: expert profile, availability, booking ownership.
- `bookings`: customer booking flow using purchased packages.
- `payments`: package and booking payments, callbacks, refunds.
- `reviews`: customer review and expert reply.
- `health`: health profile and health metrics.
- `ai`: AI chatbox and health recommendations.
- `commissions`: monthly expert commission and payout.
- `admin`: admin operations and revenue reports.
- `notifications`: in-app notifications.
- `audit`: sensitive operation logs.

Use `docs/schema-dbio.sql` and `docs/chuc-nang` as the source of truth for rebuilding entities and APIs.

