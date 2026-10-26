# Security Specification for Pharmacy Order Management

## 1. Data Invariants
- Each user profile `/users/{userId}` can only be accessed and modified by the authenticated user whose `request.auth.uid == userId`.
- Each order draft `/users/{userId}/drafts/{draftId}` strictly belongs to the parent user. A user can only create, read, update, or delete drafts in their own subcollection where `request.auth.uid == userId`.
- User ID and draft ID path variables must satisfy `isValidId()`.
- An incoming order draft must have its `userId` field match `request.auth.uid`.
- Timestamps and required string limits must be strictly guarded against Denial-of-Wallet and payload injection.

## 2. The Dirty Dozen Payloads
1. Spoofed User ID: Creating draft under user B's path with user A's auth.
2. Unauthenticated Write: Attempting to write to `/users/{userId}` without auth.
3. Path Injection: Document ID with special characters or > 128 characters.
4. Over-sized Note: Notes exceeding 1000 characters.
5. Injected Admin Flag: Trying to insert `isAdmin: true` into `UserProfile`.
6. Orphan Draft: Attempting to create a draft directly in the root without parent user.
7. Status Poisoning: Setting `status` to an invalid enum string like `"deleted"`.
8. Negative Discount: Supplying invalid discount values.
9. Cross-user Read: User A listing `/users/{userB}/drafts`.
10. Unverified Email Access (where applicable): Access without verified identity.
11. PII Extraction: Unauthorized querying of pharmacy telephone/address.
12. Terminal Draft Tampering: Tampering with locked/archived records without ownership.

## 3. Enforcement Strategy
All rules are enforced using Attribute-Based Access Control (ABAC) and the Master Gate pattern in `firestore.rules`.
