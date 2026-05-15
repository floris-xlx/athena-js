import { createPostgresIntrospectionProvider } from '../schema/postgres-provider.ts'
import type { IntrospectionSnapshot, SchemaIntrospectionProvider } from '../schema/types.ts'
import type {
  GeneratorExperimentalFlags,
  GeneratorProviderConfig,
  PostgresDirectProviderConfig,
  PostgresGatewayProviderConfig,
  ScyllaDirectProviderConfig,
} from './types.ts'

class AthenaGatewayPostgresIntrospectionProvider implements SchemaIntrospectionProvider {
  readonly backend = 'postgresql' as const

  constructor(private readonly config: PostgresGatewayProviderConfig) {}

  async inspect(): Promise<IntrospectionSnapshot> {
    throw new Error(
      `Postgres gateway introspection is not implemented yet for ${this.config.gatewayUrl}. Use mode=direct for now.`,
    )
  }
}

class ScyllaIntrospectionProvider implements SchemaIntrospectionProvider {
  readonly backend = 'scylladb' as const

  constructor(private readonly config: ScyllaDirectProviderConfig) {}

  async inspect(): Promise<IntrospectionSnapshot> {
    throw new Error(
      `Scylla introspection provider is not implemented yet for keyspace ${this.config.keyspace}.`,
    )
  }
}

function createPostgresProvider(config: PostgresDirectProviderConfig): SchemaIntrospectionProvider {
  return createPostgresIntrospectionProvider({
    connectionString: config.connectionString,
    database: config.database,
  })
}

/**
 * Resolves a runtime introspection provider from generator config.
 */
export function resolveGeneratorProvider(
  providerConfig: GeneratorProviderConfig,
  experimentalFlags: GeneratorExperimentalFlags,
): SchemaIntrospectionProvider {
  if (providerConfig.kind === 'postgres' && providerConfig.mode === 'direct') {
    return createPostgresProvider(providerConfig)
  }

  if (providerConfig.kind === 'postgres' && providerConfig.mode === 'gateway') {
    if (!experimentalFlags.postgresGatewayIntrospection) {
      throw new Error(
        'Postgres gateway introspection is experimental. Set experimental.postgresGatewayIntrospection=true to opt in.',
      )
    }
    return new AthenaGatewayPostgresIntrospectionProvider(providerConfig)
  }

  if (providerConfig.kind === 'scylla') {
    if (!experimentalFlags.scyllaProviderContracts) {
      throw new Error(
        'Scylla provider contracts are disabled. Set experimental.scyllaProviderContracts=true to enable placeholders.',
      )
    }
    return new ScyllaIntrospectionProvider(providerConfig)
  }

  throw new Error(`Unsupported generator provider kind: ${(providerConfig as { kind?: string }).kind ?? 'unknown'}`)
}
