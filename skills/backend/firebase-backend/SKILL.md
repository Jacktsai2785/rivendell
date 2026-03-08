---
name: firebase-backend
description: >
  Firebase backend design: Firestore schema, Security Rules, Cloud Functions v2,
  and FCM push notifications.
  TRIGGER when: user designs Firestore collections, writes security rules,
  creates Cloud Functions, sets up FCM, or asks about Firebase architecture.
  DO NOT TRIGGER when: working with non-Firebase backends (Supabase, custom REST API, etc.).
tags: [backend, firebase]
version: 1
source: manual
user_invocable: false
---

# Firebase Backend Design

## Firestore Schema Design

### Document vs Subcollection Decision

Use this decision tree:

1. **Embed in document** when:
   - Data is always read together with parent
   - Array size is bounded (< 500 items)
   - No need to query embedded data independently

2. **Use subcollection** when:
   - Data grows unboundedly (messages, logs, activity)
   - Need to query/paginate independently
   - Need separate security rules per item

3. **Use root collection with reference** when:
   - Many-to-many relationships
   - Data is shared across multiple parents
   - Need collection group queries

### Denormalization Strategy

- Duplicate data that is read frequently but written rarely
- Keep a `updatedAt` timestamp on denormalized copies for staleness detection
- Use Cloud Functions to propagate updates to denormalized copies
- Common pattern: store `userName` and `userAvatar` on documents that reference a user

### Composite Indexes

- Firestore requires composite indexes for queries with multiple `where` + `orderBy`
- Define indexes in `firestore.indexes.json` and deploy with `firebase deploy --only firestore:indexes`
- Avoid over-indexing — each index costs write performance and storage
- Use `__name__` as implicit sort tiebreaker

### Data Modeling Patterns

```
// Counter with distributed sharding (for high-write counters)
counters/{counterId}/shards/{shardId}  → { count: Number }

// Feed / timeline with fan-out
users/{uid}/feed/{postId}  → { ...postSnapshot, authorId, createdAt }

// Presence tracking
users/{uid}/presence  → { online: Boolean, lastSeen: Timestamp }
```

## Security Rules

### Template Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions — define at top
    function isAuth() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isAuth() && request.auth.uid == uid;
    }

    function hasRole(role) {
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    function isValidString(field, minLen, maxLen) {
      return field is string && field.size() >= minLen && field.size() <= maxLen;
    }

    // Always deny root access
    match /{document=**} {
      allow read, write: if false;
    }

    // Per-collection rules
    match /users/{uid} {
      allow read: if isAuth();
      allow create: if isOwner(uid) && isValidUserData();
      allow update: if isOwner(uid) && isValidUserData();
      allow delete: if false;  // soft-delete only
    }
  }
}
```

### Common Vulnerabilities to Check

1. **Missing auth check** — every rule should start with `request.auth != null`
2. **No field type validation** — validate `request.resource.data` field types
3. **Missing field restriction** — use `request.resource.data.keys().hasOnly([...])` to prevent extra fields
4. **Wildcard access** — avoid `match /{document=**}` with permissive rules
5. **Recursive wildcard leak** — subcollection rules don't inherit parent restrictions
6. **Missing rate limiting** — use `request.time` comparisons for write throttling
7. **Stale token data** — custom claims are cached; force token refresh after role changes

### Testing with Emulator

```bash
# Start emulator
firebase emulators:start --only firestore

# Run rules tests
firebase emulators:exec --only firestore "npm test"
```

Always write `@firebase/rules-unit-testing` tests for security rules before deploying.

## Cloud Functions v2

### Structure Templates

```typescript
// onCall — client-callable function
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const myFunction = onCall(
  { region: "asia-east1", memory: "256MiB" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in");
    }
    // Validate input
    const { fieldA } = request.data;
    if (typeof fieldA !== "string") {
      throw new HttpsError("invalid-argument", "fieldA must be string");
    }
    // Business logic
    return { result: "ok" };
  }
);
```

```typescript
// onDocumentCreated — Firestore trigger
import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const onUserCreated = onDocumentCreated(
  { document: "users/{uid}", region: "asia-east1" },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const userData = snapshot.data();
    // Idempotency: check if side-effect already applied
    // e.g., check if welcome email already sent
  }
);
```

```typescript
// onSchedule — cron job
import { onSchedule } from "firebase-functions/v2/scheduler";

export const dailyCleanup = onSchedule(
  { schedule: "every 24 hours", region: "asia-east1", timeoutSeconds: 540 },
  async (event) => {
    // Batch delete expired documents
  }
);
```

### Cold Start Optimization

- Set `minInstances: 1` for latency-critical functions
- Keep imports minimal — lazy-load heavy dependencies
- Use `global` scope for reusable clients (Firestore, Auth instances)
- Prefer `"256MiB"` unless function needs more — smaller = faster cold start
- Use v2 concurrency (`concurrency: 80`) to handle multiple requests per instance

### Idempotency Design

All Firestore triggers can fire multiple times. Design for idempotency:

- Use `event.id` as deduplication key
- Store processing status in Firestore before executing side effects
- Use transactions for atomic read-check-write patterns
- For notifications: check a `notificationSent` flag before sending

## FCM Push Notifications

### Payload Types

```typescript
// Notification message — system tray display, handled by OS
const notificationPayload = {
  notification: {
    title: "New message",
    body: "You have a new message from Alice",
  },
  token: deviceToken,
};

// Data message — app handles display, works in background
const dataPayload = {
  data: {
    type: "NEW_MESSAGE",
    senderId: "abc123",
    messagePreview: "Hey there!",
  },
  token: deviceToken,
};

// Combined — notification + data
const combinedPayload = {
  notification: { title: "New message", body: "From Alice" },
  data: { type: "NEW_MESSAGE", messageId: "xyz789" },
  token: deviceToken,
};
```

### Token Management

- Store device tokens in `users/{uid}/tokens/{tokenId}` subcollection
- Update token on every app launch (tokens rotate)
- Remove invalid tokens when FCM returns `messaging/registration-token-not-registered`
- For multi-device users, send to all tokens (loop or use `sendEachForMulticast`)

### Topic Subscriptions vs Direct Token

| Use Case | Approach |
|----------|----------|
| Personal notifications | Direct token |
| Group/channel messages | Topic subscription |
| Broadcast to all users | Topic `all_users` |
| Targeted segments | Condition expressions |

### Silent Push (iOS)

```typescript
// content-available triggers background app refresh
const silentPush = {
  data: { type: "SYNC_REQUEST" },
  apns: {
    payload: { aps: { "content-available": 1 } },
  },
  token: deviceToken,
};
```

## Architecture Checklist

Before finalizing any Firebase architecture, verify:

- [ ] Security Rules cover every collection with auth checks
- [ ] Field type validation in Security Rules for all write operations
- [ ] Composite indexes defined for all multi-field queries
- [ ] Cloud Functions use v2 API (not v1)
- [ ] All Firestore triggers are idempotent
- [ ] FCM token cleanup handles expired/invalid tokens
- [ ] Emulator tests exist for Security Rules
- [ ] Denormalized data has propagation functions
- [ ] Read/write costs estimated for primary user flows
