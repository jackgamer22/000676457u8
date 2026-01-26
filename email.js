const nodemailer = require('nodemailer');
const chalk = require('chalk');
const { logInfo, logError } = require('./logger');

const MAX_RETRIES = 3;

// Function to send an email to a recipient from a sender.
async function sendEmail(contactPair, messageDrafts, signature, smtpConfig, cloneCeoEmail, nameMagxxic) {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            const transporter = nodemailer.createTransport(smtpConfig);
            const randomDelay = Math.floor(Math.random() * (15000 - 7000 + 1)) + 7000;
            await new Promise(resolve => setTimeout(resolve, randomDelay));

            let randomMessage = messageDrafts[Math.floor(Math.random() * messageDrafts.length)];
            // Replace placeholders
            randomMessage = randomMessage.replace(/{senderName}/g, contactPair.senderName)
                                         .replace(/{recipientName}/g, contactPair.recipientName)
                                         .replace(/{companyName}/g, contactPair.companyName);

            const from = cloneCeoEmail
                ? `"${contactPair.senderName}" <${contactPair.senderEmail}>`
                : `"${contactPair.senderName}" <${smtpConfig.auth.user}>`;

            const mailOptions = {
                from: from,
                to: contactPair.recipientEmail,
                subject: 'Urgent Financial Directive - Immediate Action Required',
                html: `
                    <p>Dear ${contactPair.recipientName},</p>
                    <p>${randomMessage}</p>
                    <p>Regards,</p>
                    <p>${contactPair.senderName}</p>
                    <p>CEO, ${contactPair.companyName}</p>
                    <p>${signature}</p>
                    <p>${nameMagxxic}</p>
                `,
                replyTo: contactPair.senderEmail,
            };

            const info = await transporter.sendMail(mailOptions);
            const successMessage = `Successfully sent email to ${contactPair.recipientName} from ${contactPair.senderName} via ${smtpConfig.host}. Message ID: ${info.messageId}`;
            console.log(chalk.green(successMessage));
            logInfo(successMessage);
            return;
        } catch (error) {
            retries++;
            const errorMessage = `Error sending email to ${contactPair.recipientName} (attempt ${retries}/${MAX_RETRIES}): ${error.message}`;
            console.error(chalk.red(errorMessage));
            logError(errorMessage);
            if (retries >= MAX_RETRIES) {
                const finalErrorMessage = `Failed to send email to ${contactPair.recipientName} after ${MAX_RETRIES} attempts.`;
                console.error(chalk.red(finalErrorMessage));
                logError(finalErrorMessage);
            }
        }
    }
}

module.exports = {
    sendEmail,
};
