const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const config = require('./config');

let logDir;

// Always store backend logs in userData (separate folder)
if (app && app.getPath) {
    logDir = path.join(app.getPath('userData'), 'server-logs');
} else {
    // Fallback for pure node (rare case)
    logDir = path.join(__dirname, 'server-logs');
}

// Ensure directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
    level: config.loggingMode,
    transports: [
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, "error-%DATE%.log"),
            datePattern: 'YYYY-MM-DD',
            maxSize: '2m',
            level: 'error'
        }),
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, "info-%DATE%.log"),
            datePattern: 'YYYY-MM-DD',
            maxSize: '2m',
            level: 'info'
        })
    ]
});

// Export clean functions
module.exports = {
    logError: function (err) {
        logger.error(err.stack || err);
    },
    logInfo: function (message) {
        logger.info(message);
    }
};