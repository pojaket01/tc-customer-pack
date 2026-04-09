"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = debug;
exports.error = error;
exports.info = info;
exports.warn = warn;
// logger info, error, warn, debug
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston_1.default.transports.File({ filename: "logs/combined.log" }),
    ],
});
// info
function info(message) {
    logger.info(message);
}
// debug
function debug(message) {
    logger.debug(message);
}
// warn
function warn(message) {
    logger.warn(message);
}
// error
function error(message) {
    logger.error(message);
}
//# sourceMappingURL=logger.js.map