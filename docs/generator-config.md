# Typed Schema Generator

The typed schema generator converts live database catalog metadata into additive `athena-js` registry source files.

It supports two PostgreSQL introspection paths:

- Direct PG connection (`provider.mode = "direct"`) via `pg` and `connectionString`.
- Gateway-only introspection (`provider.mode = "gateway"`) by issuing SQL catalog queries through Athena `/gateway/query`.

This means teams can generate type-safe model definitions even when direct database access is not available in CI/CD or restricted networks.

## Config File Discovery

The generator looks for one config file at the project root (or explicit `--config`):

- `athena.config.ts` (preferred)
- `athena.config.js`
- `athena-js.config.ts`
- `athena-js.config.js`
- `.athena.config.ts`
- `.athena.config.js`

## Configuration Contract

```ts
import { defineGeneratorConfig } from '@xylex-group/athena'

export default defineGeneratorConfig({
  provider: {
    kind: 'postgres',
    mode: 'direct', // or: 'gateway'
    connectionString: process.env.ATHENA_GENERATOR_PG_URL!,
    database: 'app_db',
    schemas: ['public', 'analytics'],
  },
  output: {
    targets: {
      model: 'src/generated/{database_kebab}/{schema_kebab}/{model_kebab}.model.ts',
      schema: 'src/generated/{database_kebab}/{schema_kebab}/index.ts',
      database: 'src/generated/{database_kebab}/index.ts',
      registry: 'src/generated/index.ts',
    },
    placeholderMap: {
      namespace: '{database_kebab}/{schema_kebab}',
    },
  },
  naming: {
    modelType: 'pascal',
    modelConst: 'camel',
    schemaConst: 'camel',
    databaseConst: 'camel',
    registryConst: 'camel',
  },
  features: {
    emitRelations: true,
    emitRegistry: true,
  },
  experimental: {
    postgresGatewayIntrospection: false,
    scyllaProviderContracts: true,
  },
})
```

## Provider Modes

### 1) Direct PG URL mode

Use when your environment can reach PostgreSQL directly.

```ts
provider: {
  kind: 'postgres',
  mode: 'direct',
  connectionString: process.env.ATHENA_GENERATOR_PG_URL!,
  database: 'app_db',
  schemas: ['public'],
}
```

### 2) Gateway-only mode

Use when direct DB connectivity is blocked or not desired.

```ts
provider: {
  kind: 'postgres',
  mode: 'gateway',
  gatewayUrl: process.env.ATHENA_GATEWAY_URL!,
  apiKey: process.env.ATHENA_GATEWAY_API_KEY!,
  database: 'app_db',
  schemas: ['public'],
  backend: 'postgresql',
}
```

Gateway mode executes PostgreSQL catalog SQL via Athena `query` APIs only.
`experimental.postgresGatewayIntrospection` is now a backward-compatible no-op toggle and is not required for gateway mode.

## CLI

```bash
athena-js generate
athena-js generate --config ./athena.config.ts
athena-js generate --dry-run
```

- `generate`: introspect + emit files.
- `--dry-run`: resolve and render in-memory only, prints planned files.
- `--config`: explicit config file path.

## Placeholder Tokens

Built-in tokens:

- `{provider}`
- `{kind}`
- `{database}` / `{database_camel}` / `{database_pascal}` / `{database_snake}` / `{database_kebab}`
- `{schema}` / `{schema_camel}` / `{schema_pascal}` / `{schema_snake}` / `{schema_kebab}`
- `{model}` / `{model_camel}` / `{model_pascal}` / `{model_snake}` / `{model_kebab}`

Custom aliases are declared under `output.placeholderMap` and can reference existing tokens.

## Naming Rules

Supported naming styles:

- `preserve`
- `camel`
- `pascal`
- `snake`
- `kebab`

Unsafe or reserved identifiers are normalized to safe TypeScript identifiers for generated symbols, while unsafe column names are preserved as quoted property keys in interfaces.

## Generated Artifacts

The renderer emits up to four artifact categories:

- `model` per table
- `schema` index per schema
- `database` index per logical database
- `registry` root index (can be disabled)

`features.emitRegistry = false` disables registry file output.

`features.emitRelations = false` omits relation metadata blocks from generated model definitions.

## Output Metadata Guarantees

Generated models include:

- `primaryKey`
- `nullable`
- `relations` (when enabled)
- `tableName` as `schema.table`

Type mapping uses `resolvePostgresColumnType()` and covers:

- Numeric families (`int2/int4 -> number`, `int8/numeric -> string`)
- Booleans, text, UUID, JSON/JSONB
- Temporal/network/geometric/bit/xml/full-text families
- Enum/domain/range/multirange/composite
- Nested arrays via `arrayDimensions`

## Relation Typing

Extracted relation kinds:

- `one-to-one`
- `one-to-many`
- `many-to-one`
- `many-to-many` (bridge detection)

Many-to-many relations include `through` metadata with bridge schema/model and join columns.

## Reserved Identifier Handling

- SQL identifier quoting remains enforced in query-builder fallback paths.
- Generated TypeScript properties preserve exact column names.
- Unsafe column names such as `table`, `order`, `user`, mixed-case, and spaces are emitted as safe quoted keys.

## Runtime Pipeline

`runSchemaGenerator()` performs:

1. Config discovery/loading/normalization
2. Provider resolution
3. Catalog introspection snapshot creation
4. Artifact generation from snapshot
5. File writes (unless dry-run)

## Testing Coverage (Current)

- Config loading and normalization.
- Placeholder rendering and feature toggles.
- Postgres datatype mapping across scalar/advanced families.
- Direct `pg_url` provider resolution and snapshot output.
- Gateway-only provider resolution and `/gateway/query` execution path.
- Pipeline end-to-end output writing for direct and gateway modes.
- Existing Postgres introspection unit/integration coverage remains intact.

## Limitations and Planned Extensions

- Scylla provider remains contract-only placeholder.
- Custom SQL input APIs are still intentionally out of scope for this generator phase.
- Future work can add write-mode controls (`overwrite/skip/merge`) and formatter hooks.
