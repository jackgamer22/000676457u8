const fs = require('fs');

const logFilePath = 'sender.log';

function log(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
}

function logInfo(message) {
    log(`INFO: ${message}`);
}

function logError(message) {
    log(`ERROR: ${message}`);
}

module.exports = {
    logInfo,
    logError,
};
