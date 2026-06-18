import { strict as assert } from 'assert'
import { test } from 'node:test'
import { parseCommand, runCLI, usage, type CliRuntime } from '../src/cli/index.ts'
import type { NormalizedAthenaGeneratorConfig } from '../src/generator/index.ts'

function createNormalizedGeneratorConfig(
  format: 'define-model' | 'table-builder',
  modelTarget = 'athena/models/{schema_kebab}/{model_kebab}.ts',
): NormalizedAthenaGeneratorConfig {
  return {
    provider: {
      kind: 'postgres',
      mode: 'direct',
      connectionString: 'postgres://postgres:postgres@127.0.0.1:5432/app_db',
      database: 'app_db',
      schemas: ['public'],
    },
    output: {
      format,
      targets: {
        model: modelTarget,
        schema: 'athena/schemas/{schema_kebab}.ts',
        database: 'athena/relations.ts',
        registry: 'athena/config.ts',
      },
      placeholderMap: {},
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
    internal: {
      schemaVersion: 1,
    },
  }
}

test('parseCommand supports generate subcommand help flag', () => {
  const parsed = parseCommand(['generate', '--help'])
  assert.deepEqual(parsed, { command: 'help', topic: 'generate' })
})

test('parseCommand supports help generate alias', () => {
  const parsed = parseCommand(['help', 'generate'])
  assert.deepEqual(parsed, { command: 'help', topic: 'generate' })
})

test('usage returns generate help text for topic generate', () => {
  const text = usage('generate')
  assert.equal(text.includes('athena-js generate'), true)
  assert.equal(text.includes('-h, --help'), true)
  assert.equal(text.includes('DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/app_db'), true)
  assert.equal(text.includes('env-only gateway mode when ATHENA_URL + ATHENA_API_KEY are present'), true)
})

test('runCLI prints generate help output', async () => {
  const logs: string[] = []
  await runCLI(['generate', '--help'], {
    log: message => {
      logs.push(message)
    },
  })

  assert.equal(logs.length, 1)
  assert.equal(logs[0].includes('athena-js generate'), true)
  assert.equal(logs[0].includes('--config <path>'), true)
})

test('runCLI prints dry-run output for legacy define-model artifacts', async () => {
  const logs: string[] = []
  await runCLI(['generate', '--dry-run'], {
    log: message => {
      logs.push(message)
    },
    runGenerator: async () => ({
      configPath: 'C:/tmp/athena.config.ts',
      config: createNormalizedGeneratorConfig('define-model'),
      snapshot: {
        backend: 'postgresql',
        database: 'app_db',
        generatedAt: new Date('2026-06-16T00:00:00.000Z').toISOString(),
        schemas: {},
      },
      files: [
        {
          kind: 'model',
          path: 'src/generated/app-db/public/users.model.ts',
          content: '',
        },
      ],
      writtenFiles: [],
    }),
  })

  assert.equal(logs[0].includes('[dry-run] Generated 1 files'), true)
  assert.equal(logs[1], '[mode] format=define-model modelTarget=athena/models/{schema_kebab}/{model_kebab}.ts')
  assert.equal(logs[2].includes('Zero-style table-builder files are not active'), true)
  assert.equal(logs[3].includes('experimental.findManyAst only affects runtime findMany(...) transport'), true)
  assert.equal(logs[4].includes('Flat athena/models/*.ts output is opt-in'), true)
  assert.equal(logs[5], ' - src/generated/app-db/public/users.model.ts')
})

test('runCLI prints dry-run output for table-builder artifacts', async () => {
  const logs: string[] = []
  await runCLI(['generate', '--dry-run'], {
    log: message => {
      logs.push(message)
    },
    runGenerator: async () => ({
      configPath: 'C:/tmp/athena.config.ts',
      config: createNormalizedGeneratorConfig('table-builder'),
      snapshot: {
        backend: 'postgresql',
        database: 'app_db',
        generatedAt: new Date('2026-06-16T00:00:00.000Z').toISOString(),
        schemas: {},
      },
      files: [
        {
          kind: 'model',
          path: 'src/generated/app-db/public/users.ts',
          content: '',
        },
      ],
      writtenFiles: [],
    }),
  })

  assert.equal(logs[0].includes('[dry-run] Generated 1 files'), true)
  assert.equal(logs[1], '[mode] format=table-builder modelTarget=athena/models/{schema_kebab}/{model_kebab}.ts')
  assert.equal(logs[2].includes('Table-builder generation is stable'), true)
  assert.equal(logs[3].includes('Flat athena/models/*.ts output is opt-in'), true)
  assert.equal(logs[4], ' - src/generated/app-db/public/users.ts')
})

test('runCLI normalizes postgres missing database errors with actionable guidance', async () => {
  const failingGenerator = async () => {
    const error = new Error('database "app_db" does not exist') as Error & { code: string }
    error.code = '3D000'
    throw error
  }

  await assert.rejects(
    runCLI(['generate', '--config', './athena.config.ts', '--dry-run'], {
      runGenerator: failingGenerator as NonNullable<CliRuntime['runGenerator']>,
    }),
    (error: unknown) => {
      if (!(error instanceof Error)) {
        return false
      }
      assert.equal(error.message.includes('PostgreSQL database "app_db" does not exist'), true)
      assert.equal(error.message.includes('provider.connectionString'), true)
      return true
    },
  )
})
