import { initialize } from './app/database'

(async () => {
    await initialize()

    console.info('Database initialized.')
})()