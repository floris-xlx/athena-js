import { strict as assert } from 'assert'
import { test } from 'node:test'
import type { IntrospectionColumn } from '../src/schema/index.ts'
import { resolvePostgresColumnType } from '../src/generator/index.ts'

function column(dataType: string, udtName: string, typeKind: IntrospectionColumn['typeKind'] = 'scalar', arrayDimensions = 0, enumValues?: string[]): IntrospectionColumn {
  return {
    name: 'col',
    dataType,
    udtName,
    typeKind,
    isNullable: false,
    isPrimaryKey: false,
    hasDefault: false,
    isGenerated: false,
    arrayDimensions,
    enumValues,
  }
}

test('resolvePostgresColumnType covers scalar families and advanced postgres datatypes', () => {
  const cases: Array<{ input: IntrospectionColumn; expected: string }> = [
    { input: column('smallint', 'int2'), expected: 'number' },
    { input: column('integer', 'int4'), expected: 'number' },
    { input: column('bigint', 'int8'), expected: 'string' },
    { input: column('numeric', 'numeric'), expected: 'string' },
    { input: column('boolean', 'bool'), expected: 'boolean' },
    { input: column('bytea', 'bytea'), expected: 'Buffer' },
    { input: column('uuid', 'uuid'), expected: 'string' },
    { input: column('jsonb', 'jsonb'), expected: 'Record<string, unknown>' },
    { input: column('timestamp with time zone', 'timestamptz'), expected: 'string' },
    { input: column('inet', 'inet'), expected: 'string' },
    { input: column('point', 'point'), expected: 'string' },
    { input: column('bit varying', 'varbit'), expected: 'string' },
    { input: column('xml', 'xml'), expected: 'string' },
    { input: column('tsvector', 'tsvector'), expected: 'string' },
    { input: column('int4range', 'int4range', 'range'), expected: 'string' },
    { input: column('int4multirange', 'int4multirange', 'multirange'), expected: 'string' },
    { input: column('address_type', 'address_type', 'composite'), expected: 'Record<string, unknown>' },
    { input: column('mood', 'mood', 'enum', 0, ['happy', 'sad']), expected: "'happy' | 'sad'" },
    { input: column('text[]', '_text', 'scalar', 1), expected: 'Array<string>' },
    { input: column('int4[][]', '_int4', 'scalar', 2), expected: 'Array<Array<number>>' },
  ]

  for (const entry of cases) {
    assert.equal(resolvePostgresColumnType(entry.input), entry.expected)
  }
})
