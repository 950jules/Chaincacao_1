# Security Specification - ChainCacao

## 1. Data Invariants
- A `Lot` must have a valid `farmerId`.
- Only the creator (farmer) can set the initial `weight` and `gps`.
- `officialWeight` and `qualityGrade` can only be set by a `COOP`.
- `status` transitions must be linear: `CREATED` -> `COLLECTED` -> `EXPORTED`.
- `transfers` are immutable once created.

## 2. The Dirty Dozen Payloads (Rejection Targets)
1. User profile update: Changing `role` from AGR to COOP yourself.
2. Lot creation: Setting `status` to `EXPORTED` directly on creation.
3. Lot update: A farmer changing the `officialWeight` set by a coop.
4. Lot update: Changing `farmerId` of an existing lot.
5. Lot update: Injecting a 1MB string into the `qualityGrade` field.
6. Transfer creation: Creating a transfer for a lot the actor doesn't have permissions for.
7. Transfer creation: Spoofing the `hash` (client-provided hash should match certain rules, though hard to verify without real blockchain).
8. Reading other users' PII (phone numbers, full names if not public).
9. Deleting a lot (Lots should be immutable/append-only history).
10. Creating a lot with a future timestamp.
11. Updating `createdAt` or `id` fields.
12. Listing all users (Privacy risk).

## 3. Rules Draft (DRAFT_firestore.rules)
... (to be generated in the next step)
