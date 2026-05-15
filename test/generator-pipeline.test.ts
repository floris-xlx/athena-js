import { strict as assert } from 'assert'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { test } from 'node:test'
import type { SchemaIntrospectionProvider } from '../src/schema/index.ts'
import { runSchemaGenerator } from '../src/generator/index.ts'

function createSnapshotProvider(): SchemaIntrospectionProvider {
  return {
    backend: 'postgresql',
    async inspect() {
      return {
        backend: 'postgresql',
        database: 'phase_two',
        generatedAt: new Date('2026-05-15T00:00:00.000Z').toISOString(),
        schemas: {
          public: {
            name: 'public',
            tables: {
              users: {
                schema: 'public',
                name: 'users',
                primaryKey: ['id'],
                relations: {},
                columns: {
                  id: {
                    name: 'id',
                    dataType: 'uuid',
                    udtName: 'uuid',
                    typeKind: 'scalar',
                    isNullable: false,
                    isPrimaryKey: true,
                    hasDefault: false,
                    isGenerated: false,
                    arrayDimensions: 0,
                  },
                  email: {
                    name: 'email',
                    dataType: 'text',
                    udtName: 'text',
                    typeKind: 'scalar',
                    isNullable: false,
                    isPrimaryKey: false,
                    hasDefault: false,
                    isGenerated: false,
                    arrayDimensions: 0,
                  },
                },
              },
            },
          },
        },
      }
    },
  }
}

test('runSchemaGenerator loads athena.config.ts and writes generated artifacts', async () => {
  const root = mkdtempSync(join(tmpdir(), 'athena-generator-run-'))
  try {
    writeFileSync(
      join(root, 'athena.config.ts'),
      `
      export default {
        provider: {
          kind: 'postgres',
          mode: 'direct',
          connectionString: 'postgres://postgres:postgres@127.0.0.1:5432/phase_two',
          database: 'phase_two',
          schemas: ['public'],
        },
        output: {
          targets: {
            model: 'src/generated/{database_kebab}/{schema_kebab}/{model_kebab}.model.ts',
            schema: 'src/generated/{database_kebab}/{schema_kebab}/index.ts',
            database: 'src/generated/{database_kebab}/index.ts',
            registry: 'src/generated/index.ts',
          },
        },
      }
      `,
      'utf8',
    )

    const result = await runSchemaGenerator({
      cwd: root,
      provider: createSnapshotProvider(),
    })

    assert.equal(result.files.length, 4)
    assert.equal(result.writtenFiles.length, 4)

    const modelPath = join(root, 'src', 'generated', 'phase-two', 'public', 'users.model.ts')
    const content = readFileSync(modelPath, 'utf8')
    assert.equal(content.includes('export interface PublicUsersRow'), true)
    assert.equal(content.includes('email: string'), true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
