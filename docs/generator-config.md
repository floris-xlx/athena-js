# Typed Schema Generator (Phase 2 Scaffolding)

`athena-js` now ships a first-class generator core with project-root config discovery.

## Config file

Place a config file at your project root:

- `athena.config.ts` (preferred)
- `athena.config.js`
- `athena-js.config.ts`
- `athena-js.config.js`
- `.athena.config.ts`
- `.athena.config.js`

Example:

```ts
import { defineGeneratorConfig } from '@xylex-group/athena'

export default defineGeneratorConfig({
  provider: {
    kind: 'postgres',
    mode: 'direct',
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

## CLI

```bash
athena-js generate
athena-js generate --config ./athena.config.ts
athena-js generate --dry-run
```

## Placeholder tokens

Built-in tokens:

- `{provider}`
- `{kind}`
- `{database}` / `{database_camel}` / `{database_pascal}` / `{database_snake}` / `{database_kebab}`
- `{schema}` / `{schema_camel}` / `{schema_pascal}` / `{schema_snake}` / `{schema_kebab}`
- `{model}` / `{model_camel}` / `{model_pascal}` / `{model_snake}` / `{model_kebab}`

Custom tokens can be defined in `output.placeholderMap` and reference other tokens.

## Provider status

- `postgres + direct`: implemented.
- `postgres + gateway`: interface scaffolded behind experimental toggle.
- `scylla + direct`: contract scaffolded behind experimental toggle.

## Output model metadata

Generated models include:

- `primaryKey`
- `nullable`
- `relations` (when `features.emitRelations = true`)
- `tableName` (`schema.table`)

Reserved or unsafe column names are emitted as safe TypeScript property keys.
Postgres type families are mapped through `resolvePostgresColumnType()` with array/enum handling.
