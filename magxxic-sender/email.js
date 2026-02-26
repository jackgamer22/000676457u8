const smtpService = require('./services/smtp');
const sendgridService = require('./services/sendgrid');
const directService = require('./services/direct');

function getEmailService() {
    const provider = process.env.MAIL_PROVIDER;
    if (provider === 'sendgrid') {
        return sendgridService;
    }
    if (provider === 'smtp') {
        return smtpService;
    }
    if (provider === 'direct') {
        return directService;
    }
    throw new Error(`Invalid mail provider specified: ${provider}`);
}

module.exports = {
    getEmailService,
};
