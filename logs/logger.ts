// logger info, error, warn, debug
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// info
function info(message: string) {
  logger.info(message);
}

// debug
function debug(message: string) {
  logger.debug(message);
}

// warn
function warn(message: string) {
  logger.warn(message);
}

// error
function error(message: string) {
  logger.error(message);
}

export { debug, error, info, warn };
