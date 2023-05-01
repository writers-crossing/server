import { initialize as database_initialize } from './app/database.js'
import { initialize as discord_initialize } from './discord/index.js'

await database_initialize()
await discord_initialize()