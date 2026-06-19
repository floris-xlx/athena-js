import { mkdir, stat, writeFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { generateArtifactsFromSnapshot } from './renderer.ts'
import { loadGeneratorConfig } from './config.ts'
import { resolveGeneratorProvider } from './providers.ts'
import { resolveProviderSchemas } from './schema-selection.ts'
import type {
  GeneratedArtifact,
  LoadGeneratorConfigOptions,
  RunGeneratorOptions,
  RunGeneratorResult,
  SkippedGeneratedArtifact,
} from './types.ts'

function canOverwriteArtifact(file: GeneratedArtifact): boolean {
  return file.kind === 'model' || file.kind === 'schema'
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function writeArtifacts(
  files: GeneratedArtifact[],
  cwd: string,
): Promise<{
  writtenFiles: string[]
  skippedFiles: SkippedGeneratedArtifact[]
}> {
  const writtenFiles: string[] = []
  const skippedFiles: SkippedGeneratedArtifact[] = []

  for (const file of files) {
    const absolutePath = resolve(cwd, file.path)
    if (!canOverwriteArtifact(file) && await fileExists(absolutePath)) {
      skippedFiles.push({
        kind: file.kind,
        path: file.path,
        reason: 'protected-existing-file',
      })
      continue
    }
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, file.content, 'utf8')
    writtenFiles.push(file.path)
  }

  return {
    writtenFiles,
    skippedFiles,
  }
}

/**
 * End-to-end generator execution: load config, introspect, render, and optionally write files.
 */
export async function runSchemaGenerator(options: RunGeneratorOptions = {}): Promise<RunGeneratorResult> {
  const cwd = options.cwd ?? process.cwd()
  const configOptions: LoadGeneratorConfigOptions = {
    cwd,
    configPath: options.configPath,
  }

  const { configPath, config } = await loadGeneratorConfig(configOptions)
  const provider = options.provider ?? resolveGeneratorProvider(config.provider, config.experimental)

  const snapshot = await provider.inspect({
    schemas: resolveProviderSchemas(config.provider),
  })

  const generated = generateArtifactsFromSnapshot(snapshot, config)
  const writeResult = options.dryRun
    ? { writtenFiles: [], skippedFiles: [] }
    : await writeArtifacts(generated.files, cwd)

  return {
    ...generated,
    configPath,
    config,
    writtenFiles: writeResult.writtenFiles,
    skippedFiles: writeResult.skippedFiles,
  }
}
