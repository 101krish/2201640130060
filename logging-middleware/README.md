# @affordmed/logging-middleware

Reusable logger for sending events to the Affordmed logging API.

## Usage
`	s
import { createLogger } from  @affordmed/logging-middleware;

const log = createLogger({ apiUrl: https://logging.affordmed.com, app: frontend });

await log({ level: info, message: App started });
``n
## Build

`ash
npm run build
`