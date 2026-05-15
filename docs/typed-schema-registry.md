# Typed Schema Registry and Introspection

This guide covers the model-first typing layer added on top of the existing Athena client.

## Goals

- Keep `createClient(...).from<T>(...)` fully compatible.
- Add registry-driven model contracts for safer table resolution.
- Support optional tenant context propagation through configurable header mappings.
- Prepare backend introspection for generator workflows.

## Model-first definitions

```ts
import {
  defineModel,
  defineSchema,
  defineDatabase,
  defineRegistry,
} from "@xylex-group/athena";

interface UserRow {
  id: string;
  email: string;
}

const registry = defineRegistry({
  primary: defineDatabase({
    public: defineSchema({
      users: defineModel<UserRow>({
        meta: {
          primaryKey: ["id"],
          nullable: { id: false, email: false },
        },
      }),
    }),
  }),
});
```

## Typed client usage

```ts
import { createTypedClient } from "@xylex-group/athena";

const client = createTypedClient(registry, ATHENA_URL, ATHENA_API_KEY, {
  tenantKeyMap: {
    organizationId: "X-Organization-Id",
    workspaceId: "X-Workspace-Id",
  },
});

const response = await client
  .withTenantContext({ organizationId: "org_1" })
  .fromModel("primary", "public", "users")
  .select("*");
```

## Table-name resolution

`fromModel(database, schema, model)` resolves table names in this order:

1. `meta.tableName` if provided
2. `${meta.schema ?? schema}.${meta.model ?? model}`

This allows hard-pinning legacy physical names while keeping logical model names stable.

## Introspection provider contract

The provider contract is:

```ts
interface SchemaIntrospectionProvider {
  readonly backend: BackendType;
  inspect(options?: { schemas?: string[] }): Promise<IntrospectionSnapshot>;
}
```

`createPostgresIntrospectionProvider(...)` implements this contract by reading PostgreSQL catalog tables and returning:

- schemas
- tables
- columns with type families (`scalar`, `enum`, `domain`, `range`, `multirange`, `composite`)
- primary keys
- one-to-one, one-to-many, many-to-one, and many-to-many relations

## SQL identifier safety

For SQL fallback paths, identifiers are normalized by:

- `quoteQualifiedIdentifier("public.users")` -> `"public"."users"`
- `quoteSelectColumnsExpression("table, user")` -> `"table", "user"`

Complex select expressions (for example function calls with commas) are intentionally preserved as-is.
