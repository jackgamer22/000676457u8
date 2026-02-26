const nodemailer = require('nodemailer');
const chalk = require('chalk');
const { logInfo, logError } = require('../logger');
const { generateSenderEmail } = require('../file-utils');

const MAX_RETRIES = 3;

const fs = require('fs');

// Function to send an email to a recipient from a sender.
async function sendEmail(options) {
    const {
        contactPair,
        messageDrafts,
        smtpConfig,
        cloneCeoEmail,
        nameMagxxic,
        replyTo,
        subject,
        minDelay,
        maxDelay,
        attachmentPath,
        xOriginatingIp,
        customHeaders,
    } = options;

    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            const transporter = nodemailer.createTransport(smtpConfig);
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            await new Promise(resolve => setTimeout(resolve, randomDelay * 1000));

            let randomMessage = messageDrafts[Math.floor(Math.random() * messageDrafts.length)];
            // Replace placeholders
            randomMessage = randomMessage.replace(/{senderName}/g, contactPair.senderName)
                                         .replace(/{recipientName}/g, contactPair.recipientName)
                                         .replace(/{companyName}/g, contactPair.companyName);

            const senderEmail = generateSenderEmail(contactPair.senderName, contactPair.companyName);

            const from = cloneCeoEmail
                ? `"${contactPair.senderName}" <${senderEmail}>`
                : `"${contactPair.senderName}" <${smtpConfig.auth.user}>`;

            const recipientFirstName = contactPair.recipientName.split(' ')[0];

            const headers = {};
            if (xOriginatingIp) {
                headers['X-Originating-Ip'] = xOriginatingIp;
            }
            if (customHeaders) {
                customHeaders.split(',').forEach(header => {
                    const [key, value] = header.split(':');
                    if (key && value) {
                        headers[key.trim()] = value.trim();
                    }
                });
            }

            const mailOptions = {
                from: from,
                to: contactPair.recipientEmail,
                subject: subject,
                html: `
                    <p>Dear ${recipientFirstName},</p>
                    <p>${randomMessage}</p>
                    <p>Regards,</p>
                    <p>${contactPair.senderName}</p>
                    <p>${contactPair.position}, ${contactPair.companyName}</p>
                    <p>${nameMagxxic}</p>
                `,
                replyTo: replyTo,
                headers: headers
            };

            if (attachmentPath) {
                mailOptions.attachments = [
                    {
                        path: attachmentPath,
                    },
                ];
            }

            const info = await transporter.sendMail(mailOptions);
            const successMessage = `Successfully sent email to ${contactPair.recipientName} from ${contactPair.senderName} via ${smtpConfig.host}. Message ID: ${info.messageId}`;
            console.log(chalk.green(successMessage));
            logInfo(successMessage);
            return true;
        } catch (error) {
            retries++;
            const errorMessage = `Error sending email to ${contactPair.recipientName} (attempt ${retries}/${MAX_RETRIES}): ${error.message}`;
            console.error(chalk.red(errorMessage));
            logError(errorMessage);
            if (retries >= MAX_RETRIES) {
                const finalErrorMessage = `Failed to send email to ${contactPair.recipientName} after ${MAX_RETRIES} attempts.`;
                console.error(chalk.red(finalErrorMessage));
                logError(finalErrorMessage);
                return false;
            }
        }
    }
}

module.exports = {
    sendEmail,
};
