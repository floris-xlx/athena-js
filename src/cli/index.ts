import { runSchemaGenerator } from '../generator/pipeline.ts'

interface GenerateCommand {
  command: 'generate'
  configPath?: string
  dryRun: boolean
}

interface HelpCommand {
  command: 'help'
}

type CliCommand = GenerateCommand | HelpCommand

function usage(): string {
  return [
    'athena-js CLI',
    '',
    'Usage:',
    '  athena-js generate [--config <path>] [--dry-run]',
    '',
    'Examples:',
    '  athena-js generate',
    '  athena-js generate --config ./athena.config.ts --dry-run',
  ].join('\n')
}

function parseCommand(argv: string[]): CliCommand {
  if (argv.length === 0 || argv[0] === 'help' || argv[0] === '--help' || argv[0] === '-h') {
    return { command: 'help' }
  }

  const [command, ...rest] = argv
  if (command !== 'generate') {
    throw new Error(`Unknown command "${command}".`)
  }

  let configPath: string | undefined
  let dryRun = false

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]
    if (token === '--dry-run') {
      dryRun = true
      continue
    }

    if (token === '--config') {
      const nextValue = rest[index + 1]
      if (!nextValue) {
        throw new Error('Missing value for --config option.')
      }
      configPath = nextValue
      index += 1
      continue
    }

    throw new Error(`Unknown option "${token}".`)
  }

  return {
    command: 'generate',
    configPath,
    dryRun,
  }
}

/**
 * CLI entrypoint used by `bin/athena-js.js`.
 */
export async function runCLI(argv: string[]): Promise<void> {
  const parsed = parseCommand(argv)
  if (parsed.command === 'help') {
    console.log(usage())
    return
  }

  const result = await runSchemaGenerator({
    configPath: parsed.configPath,
    dryRun: parsed.dryRun,
  })

  if (parsed.dryRun) {
    console.log(`[dry-run] Generated ${result.files.length} files from ${result.configPath}`)
    for (const file of result.files) {
      console.log(` - ${file.path}`)
    }
    return
  }

  console.log(`Generated ${result.writtenFiles.length} files from ${result.configPath}`)
  for (const filePath of result.writtenFiles) {
    console.log(` - ${filePath}`)
  }
}
