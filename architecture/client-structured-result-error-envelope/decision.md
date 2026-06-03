# Client structured result error envelope

## Context

`AthenaResult<T>` exposed `error` as a string and pushed the richer fields into `errorDetails` plus optional `normalizeAthenaError(result)` follow-up calls. That forced consumers to stitch together multiple surfaces to get the same ergonomics expected from a `{ data, error }` SDK contract.

## Decision

Failed `AthenaResult<T>` values now expose a structured `error` object by default. The object carries:

- `message`
- `code`
- `details`
- `hint`
- `status`
- `statusText`
- normalized metadata such as `kind`, `category`, `retryable`, `table`, `operation`, and `constraint`

`errorDetails` remains on the result as a compatibility alias for low-level gateway metadata like `gatewayCode`, `endpoint`, `method`, and `requestId`.

## Deprecation note

`experimental.enableErrorNormalization` is now a deprecated no-op. The formatter always computes and attaches normalized metadata for failed result envelopes.

## Consequences

- Consumers can treat `const { data, error } = await ...` as the primary contract.
- Callers no longer need a separate normalization pass for common branching and logging.
- Code that assumed `result.error` was a plain string must move to `result.error?.message`.
