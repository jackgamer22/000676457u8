const sgMail = require('@sendgrid/mail');
const chalk = require('chalk');
const { logInfo, logError } = require('../logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const MAX_RETRIES = 3;

// Function to send an email to a recipient from a sender using SendGrid.
async function sendEmail(contactPair, messageDrafts, nameMagxxic, replyTo) {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            const randomDelay = Math.floor(Math.random() * (15000 - 7000 + 1)) + 7000;
            await new Promise(resolve => setTimeout(resolve, randomDelay));

            let randomMessage = messageDrafts[Math.floor(Math.random() * messageDrafts.length)];
            // Replace placeholders
            randomMessage = randomMessage.replace(/{senderName}/g, contactPair.senderName)
                                         .replace(/{recipientName}/g, contactPair.recipientName)
                                         .replace(/{companyName}/g, contactPair.companyName);

            const from = {
                name: contactPair.senderName,
                email: process.env.SENDGRID_FROM_EMAIL, // SendGrid requires a verified sender
            };

            const recipientFirstName = contactPair.recipientName.split(' ')[0];

            const msg = {
                to: contactPair.recipientEmail,
                from: from,
                replyTo: replyTo,
                subject: 'Urgent Financial Directive - Immediate Action Required',
                html: `
                    <p>Dear ${recipientFirstName},</p>
                    <p>${randomMessage}</p>
                    <p>Regards,</p>
                    <p>${contactPair.senderName}</p>
                    <p>${contactPair.position}, ${contactPair.companyName}</p>
                    <p>${nameMagxxic}</p>
                `,
            };

            await sgMail.send(msg);
            const successMessage = `Successfully sent email to ${contactPair.recipientName} from ${contactPair.senderName} via SendGrid.`;
            console.log(chalk.green(successMessage));
            logInfo(successMessage);
            return;
        } catch (error) {
            retries++;
            const errorMessage = `Error sending email to ${contactPair.recipientName} via SendGrid (attempt ${retries}/${MAX_RETRIES}): ${error.message}`;
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
