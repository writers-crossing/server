import { createLogger, format, transports } from 'winston'

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.simple()
  ),
  transports: [
    new transports.File({ filename: 'app-error.log', level: 'error' }),
    new transports.File({ filename: 'app.log' })
  ]
})

logger.add(new transports.Console({ format: format.combine(format.colorize(), format.simple()) }))

export default logger