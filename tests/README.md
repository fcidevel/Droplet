# Droplet • Tests

The test suite behind [Droplet](../README.md). It is written test-first: each change
starts with a failing test for observable behaviour, then the minimum code to pass it,
then a refactor with the tests kept green.

| Folder           | Runner                                | Scope                                                                         |
| ---------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| [`unit/`](unit/) | [Vitest](https://vitest.dev/)         | Server Actions, route handlers, models, stores, utilities and UI components   |
| [`e2e/`](e2e/)   | [Playwright](https://playwright.dev/) | Chat, billing, admin and auth-boundary flows, plus accessibility checks (axe) |

## Shared test support

[`unit/test-support/index.ts`](unit/test-support/index.ts) centralises typed factories
and mocks, so individual tests stay short and free of ad-hoc casts.

**Data factories**

- `createTestUser()` - user records (`UserData` shape)
- `createTestTask()` - conversation/task records (`TaskConversation` shape)
- `createTestTransaction()` - transaction records
- `createTestClerkUser()` - Clerk user payloads

**HTTP helpers**

- `buildMockRequest()` - JSON route requests
- `buildMockNextRequest()` - Next.js route handler requests (with `formData` support)
- `readJsonResponse<T>()` - typed response body parsing

**Mock helpers**

- `mockAuth()` - authenticated and unauthenticated Clerk auth responses
- `mockAdminAuth()` - admin auth context with role metadata
- `mockMongooseModel()` - typed Mongoose chain mocks (`select/sort/limit/skip/lean/exec`)
- `mockClerkUser()` - typed `clerkClient().users.getUser()` responses

## Example

```ts
import { auth } from "@clerk/nextjs/server";
import { vi } from "vitest";
import { mockAuth, mockMongooseModel, createTestUser } from "../test-support";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));

mockAuth(vi.mocked(auth), { userId: "user_123" });
const userQuery = mockMongooseModel(createTestUser());
```

## Conventions

- New tests avoid `as never`: where a mock needs a cast, the cast is added to the
  shared helpers and typed once.

## License

Source-available, not open source - see the [root README](../README.md#license) and
[LICENSE](../LICENSE).
