const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const chalk = require('chalk');
const { logInfo, logError } = require('../logger');
const { generateSenderEmail } = require('../file-utils');

const MAX_RETRIES = 3;

/**
 * Resolves the MX record for a given domain.
 * @param {string} domain
 * @returns {Promise<string|null>} The MX exchange host or null if not found.
 */
async function getMxRecord(domain) {
    try {
        const records = await dns.resolveMx(domain);
        if (!records || records.length === 0) {
            return null;
        }
        // Sort by priority (lowest first)
        records.sort((a, b) => a.priority - b.priority);
        return records[0].exchange;
    } catch (error) {
        logError(`DNS MX lookup failed for ${domain}: ${error.message}`);
        return null;
    }
}

/**
 * Sends an email directly to the recipient's MX server.
 * @param {Object} options
 * @returns {Promise<boolean>}
 */
async function sendEmail(options) {
    const {
        contactPair,
        messageDrafts, // These will be the HTML templates
        proxy,
        cloneCeoEmail,
        replyTo,
        subject,
        minDelay,
        maxDelay,
        attachmentPath,
        ehloHost = 'localhost'
    } = options;

    const recipientEmail = contactPair.recipientEmail;
    const recipientDomain = recipientEmail.split('@')[1];

    const mxHost = await getMxRecord(recipientDomain);

    if (!mxHost) {
        const errorMsg = `[ERROR] DNS MX lookup failed for ${recipientDomain}`;
        console.error(chalk.red(errorMsg));
        logError(errorMsg);
        return false;
    }

    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            const transportOptions = {
                host: mxHost,
                port: 25,
                secure: false,
                name: ehloHost,
                tls: {
                    rejectUnauthorized: false
                }
            };

            if (proxy) {
                transportOptions.proxy = proxy;
            }

            const transporter = nodemailer.createTransport(transportOptions);

            // Random delay between min and max
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            // For testing/simulated run, we might want to skip this or keep it short.
            // But for real usage, we keep it.
            await new Promise(resolve => setTimeout(resolve, randomDelay * 1000));

            // Select a random template
            let htmlContent = messageDrafts[Math.floor(Math.random() * messageDrafts.length)];

            // Replace placeholders
            htmlContent = htmlContent.replace(/{senderName}/g, contactPair.senderName)
                                     .replace(/{recipientName}/g, contactPair.recipientName)
                                     .replace(/{companyName}/g, contactPair.companyName);

            const senderEmail = generateSenderEmail(contactPair.senderName, contactPair.companyName);
            const from = cloneCeoEmail
                ? `"${contactPair.senderName}" <${senderEmail}>`
                : `"${contactPair.senderName}" <postmaster@${contactPair.companyName.toLowerCase().replace(/\s/g, '')}.com>`;

            const mailOptions = {
                from: from,
                to: recipientEmail,
                subject: subject,
                html: htmlContent,
                replyTo: replyTo,
            };

            if (attachmentPath) {
                mailOptions.attachments = [{ path: attachmentPath }];
            }

            await transporter.sendMail(mailOptions);

            // Success log matching the screenshot style somewhat
            const successMessage = `DELIVERED -> ${recipientEmail} (${from} | Direct)`;
            // We'll let the main loop handle the [001/006] prefix if we want it exact,
            // or we can pass it in options.
            console.log(chalk.green(successMessage));
            logInfo(successMessage);
            return true;

        } catch (error) {
            retries++;
            const errorMessage = `[TEST] Error (attempt ${retries}/${MAX_RETRIES}): ${error.message}`;
            console.error(chalk.red(errorMessage));
            logError(errorMessage);
            if (retries >= MAX_RETRIES) {
                return false;
            }
        }
    }
}

module.exports = {
    sendEmail,
    getMxRecord,
};
