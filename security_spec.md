# Security Specification - Aurelius Finance

## Data Invariants
1. A transaction must belong to the authenticated user.
2. Users can only read/write their own data.
3. Transaction IDs and Category IDs must be valid strings.
4. Timestamps (createdAt) should be validated.
5. Users cannot modify `userId` after creation (though in this app, the path already contains `userId`).

## The Dirty Dozen Payloads

1. **Identity Theft (Write to another user's path)**
   `path: /users/victim-uid/transactions/attack-id`
   `payload: { userId: 'attacker-uid', amount: 100, ... }`
   *Result: PERMISSION_DENIED*

2. **Shadow Field Injection**
   `path: /users/attacker-uid/transactions/attack-id`
   `payload: { userId: 'attacker-uid', isAdmin: true, amount: 100, ... }`
   *Result: PERMISSION_DENIED*

3. **Malformed ID poisoning**
   `path: /users/attacker-uid/transactions/VERY-LONG-ID-..................`
   `payload: { ... }`
   *Result: PERMISSION_DENIED*

4. **Timestamp Spoofing**
   `path: /users/attacker-uid/transactions/attack-id`
   `payload: { createdAt: 123456789, ... }` (where 123456789 is a past date, but app expects current)
   *Condition: isValidTransaction should check if createdAt is reasonable if using server timestamp logic, but app uses Date.now().*

5. **Type Poisoning (Amount as string)**
   `payload: { amount: "1000", ... }`
   *Result: PERMISSION_DENIED*

6. **Enum Violation (Invalid Type)**
   `payload: { type: "malicious_type", ... }`
   *Result: PERMISSION_DENIED*

7. **PII Leakage (Read another user's settings)**
   `path: /users/victim-uid/settings/current`
   *Result: PERMISSION_DENIED*

8. **Orphaned Budget (Missing userId)**
   `payload: { category: "Food", limit: 500, period: "monthly" }` (userId missing)
   *Result: PERMISSION_DENIED*

9. **Negative Amount**
   `payload: { amount: -500, ... }`
   *Result: PERMISSION_DENIED*

10. **Global Read (Try to list all users)**
    `path: /users`
    *Result: PERMISSION_DENIED*

11. **Update Immutable Field**
    `action: update`
    `payload: { id: 'new-id' }`
    *Result: PERMISSION_DENIED*

12. **Malicious Regex String**
    `payload: { note: "A".repeat(1000000) }` (Denial of Wallet)
    *Result: PERMISSION_DENIED (Size limit)*

## Test Runner (Firestore Rules Test)

```ts
import { 
  assertFails, 
  assertSucceeds, 
  initializeTestEnvironment, 
  RulesTestEnvironment 
} from "@firebase/rules-unit-testing";
import { setDoc, getDoc, doc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "aurelius-finance-test",
    firestore: {
      rules: await fs.readFileSync("firestore.rules", "utf8"),
    },
  });
});

test("should deny writing to another user's transaction", async () => {
  const alice = testEnv.authenticatedContext("alice");
  await assertFails(setDoc(doc(alice.firestore(), "users/bob/transactions/t1"), {
    id: 't1', amount: 100, userId: 'bob', type: 'expense', category: 'Food', date: '2024-01-01', createdAt: Date.now()
  }));
});

test("should succeed writing to own transaction", async () => {
  const alice = testEnv.authenticatedContext("alice");
  await assertSucceeds(setDoc(doc(alice.firestore(), "users/alice/transactions/t1"), {
    id: 't1', amount: 100, userId: 'alice', type: 'expense', category: 'Food', date: '2024-01-01', createdAt: Date.now()
  }));
});
```
