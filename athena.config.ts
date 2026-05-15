import { defineGeneratorConfig } from './src/generator/index.ts'

export default defineGeneratorConfig({
  provider: {
    kind: 'postgres',
    mode: 'direct',
    connectionString: process.env.ATHENA_GENERATOR_PG_URL ?? 'postgres://postgres:postgres@127.0.0.1:5432/app_db',
    database: process.env.ATHENA_GENERATOR_DB ?? 'app_db',
    schemas: ['public'],
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
