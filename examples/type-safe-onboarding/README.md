# Type-Safe Onboarding

This example contrasts a plain TypeScript onboarding workflow with the branded types and
constructors provided by LFWT.

## Why it matters

Without nominal typing it is easy to mix identifiers, headers, and email addresses—especially once
services start piping data between queues, caches, and HTTP handlers. This example shows how LFWT:

- Brands user identifiers and email addresses so they cannot be swapped accidentally.
- Uses runtime constructors (e.g. `EmailFrom`) to validate external input at the edge.
- Keeps side effects behind explicit dependencies (`Deps`-style functions) for straightforward
  testing.

## Files

- `baseline/onboarding.ts` – a naive implementation that happily compiles despite mixing up IDs and
  emails.
- `branded/onboarding.ts` – the branded version that catches the same bug at compile-time and
  validates input at runtime.

## Running the scripts

```bash
# Baseline (compiles, but logs a subtle bug)
deno run examples/type-safe-onboarding/baseline/onboarding.ts

# Branded version (try removing the @ts-expect-error line to see the compiler failure)
deno run examples/type-safe-onboarding/branded/onboarding.ts
```

## Takeaways

Branding and constructors remove entire bug classes with almost no runtime cost. They also make
refactors safer because parameter lists stay intention-revealing (`UserId` vs `Email` vs raw
`string`).
