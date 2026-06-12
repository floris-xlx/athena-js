import { defineGeneratorConfig, generatorEnv } from './src/generator/index.ts'

export default defineGeneratorConfig({
  provider: {
    kind: 'postgres',
    mode: 'direct',
    connectionString: generatorEnv('ATHENA_GENERATOR_PG_URL', {
      default: 'postgres://postgres:postgres@127.0.0.1:5432/app_db',
    }),
    database: generatorEnv('ATHENA_GENERATOR_DB', { default: 'app_db' }),
    schemas: generatorEnv.list('ATHENA_GENERATOR_SCHEMAS', { default: ['public', 'athena'] }),
  },
  output: {
    targets: {
      model: 'athena/models/{schema_kebab}/{model_kebab}.ts',
      schema: 'athena/schemas/{schema_kebab}.ts',
      database: 'athena/relations.ts',
      registry: 'athena/config.ts',
    },
    placeholderMap: {
      namespace: 'athena',
    },
  },
  naming: {
    modelType: generatorEnv.oneOf(
      'ATHENA_GENERATOR_MODEL_TYPE',
      ['preserve', 'camel', 'pascal', 'snake', 'kebab'] as const,
      { default: 'pascal' },
    ),
    modelConst: generatorEnv.oneOf(
      'ATHENA_GENERATOR_MODEL_CONST',
      ['preserve', 'camel', 'pascal', 'snake', 'kebab'] as const,
      { default: 'camel' },
    ),
    schemaConst: generatorEnv.oneOf(
      'ATHENA_GENERATOR_SCHEMA_CONST',
      ['preserve', 'camel', 'pascal', 'snake', 'kebab'] as const,
      { default: 'camel' },
    ),
    databaseConst: generatorEnv.oneOf(
      'ATHENA_GENERATOR_DATABASE_CONST',
      ['preserve', 'camel', 'pascal', 'snake', 'kebab'] as const,
      { default: 'camel' },
    ),
    registryConst: generatorEnv.oneOf(
      'ATHENA_GENERATOR_REGISTRY_CONST',
      ['preserve', 'camel', 'pascal', 'snake', 'kebab'] as const,
      { default: 'camel' },
    ),
  },
  features: {
    emitRelations: generatorEnv.boolean('ATHENA_GENERATOR_EMIT_RELATIONS', { default: true }),
    emitRegistry: generatorEnv.boolean('ATHENA_GENERATOR_EMIT_REGISTRY', { default: true }),
  },
  experimental: {
    postgresGatewayIntrospection: generatorEnv.boolean(
      'ATHENA_GENERATOR_POSTGRES_GATEWAY_INTROSPECTION',
      { default: false },
    ),
    scyllaProviderContracts: generatorEnv.boolean(
      'ATHENA_GENERATOR_SCYLLA_PROVIDER_CONTRACTS',
      { default: true },
    ),
  },
})
