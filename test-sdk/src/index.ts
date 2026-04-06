import dotenv from "dotenv";
import chalk from "chalk";
import { createAthenaTestSdkServer } from "./server.js";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const ATHENA_URL = process.env.ATHENA_URL ?? "https://mirror3.athena-db.com";
const ATHENA_API_KEY = process.env.ATHENA_API_KEY ?? "";
const ATHENA_CLIENT = process.env.ATHENA_CLIENT ?? "athena_logging";

const portArg = process.argv.find((argument) => argument.startsWith("--port"));
const portFromArg = portArg
  ? Number(
      portArg.includes("=")
        ? portArg.split("=")[1]
        : process.argv[process.argv.indexOf(portArg) + 1],
    )
  : undefined;
const PORT = portFromArg ?? (Number(process.env.PORT) || 3000);

const server = createAthenaTestSdkServer({
  config: {
    athenaUrl: ATHENA_URL,
    athenaApiKey: ATHENA_API_KEY,
    athenaClient: ATHENA_CLIENT,
  },
});

server.expressApp.listen(PORT, () => {
  console.log(chalk.bold.cyan("\n  Athena Test SDK"));
  console.log(chalk.gray("  ----------------"));
  console.log(chalk.green("  •") + ` Server: ${chalk.underline(`http://localhost:${PORT}`)}`);
  console.log(chalk.gray(`  • ATHENA_URL: ${ATHENA_URL}`));
  console.log(chalk.gray(`  • ATHENA_CLIENT: ${ATHENA_CLIENT}`));
  if (!ATHENA_API_KEY) {
    console.log(chalk.yellow("  ! ATHENA_API_KEY not set - requests may fail"));
  }
  console.log("");
});
