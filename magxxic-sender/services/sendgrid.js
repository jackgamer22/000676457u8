const sgMail = require('@sendgrid/mail');
const chalk = require('chalk');
const { logInfo, logError } = require('../logger');
const { generateSenderEmail } = require('../file-utils');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const MAX_RETRIES = 3;

const fs = require('fs');

// Function to send an email to a recipient from a sender using SendGrid.
async function sendEmail(options) {
    const {
        contactPair,
        messageDrafts,
        cloneCeoEmail,
        nameMagxxic,
        replyTo,
        subject,
        minDelay,
        maxDelay,
        attachmentPath,
    } = options;

    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            await new Promise(resolve => setTimeout(resolve, randomDelay * 1000));

            let randomMessage = messageDrafts[Math.floor(Math.random() * messageDrafts.length)];
            // Replace placeholders
            randomMessage = randomMessage.replace(/{senderName}/g, contactPair.senderName)
                                         .replace(/{recipientName}/g, contactPair.recipientName)
                                         .replace(/{companyName}/g, contactPair.companyName);

            const senderEmail = generateSenderEmail(contactPair.senderName, contactPair.companyName);

            const from = {
                name: contactPair.senderName,
                email: process.env.SENDGRID_FROM_EMAIL, // SendGrid requires a verified sender
            };

            const recipientFirstName = contactPair.recipientName.split(' ')[0];

            const msg = {
                to: contactPair.recipientEmail,
                from: from,
                replyTo: replyTo,
                subject: subject,
                html: `
                    <p>Dear ${recipientFirstName},</p>
                    <p>${randomMessage}</p>
                    <p>Regards,</p>
                    <p>${contactPair.senderName}</p>
                    <p>${contactPair.position}, ${contactPair.companyName}</p>
                    <p>${nameMagxxic}</p>
                `,
            };

            if (attachmentPath) {
                const attachment = fs.readFileSync(attachmentPath).toString('base64');
                msg.attachments = [
                    {
                        content: attachment,
                        filename: attachmentPath.split('/').pop(),
                        type: 'application/octet-stream',
                        disposition: 'attachment',
                    },
                ];
            }

            await sgMail.send(msg);
            const successMessage = `Successfully sent email to ${contactPair.recipientName} from ${contactPair.senderName} via SendGrid.`;
            console.log(chalk.green(successMessage));
            logInfo(successMessage);
            return true;
        } catch (error) {
            retries++;
            const errorMessage = `Error sending email to ${contactPair.recipientName} via SendGrid (attempt ${retries}/${MAX_RETRIES}): ${error.message}`;
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
