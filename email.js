const nodemailer = require('nodemailer');
const chalk = require('chalk');
const { logInfo, logError } = require('./logger');

const MAX_RETRIES = 3;

// Function to send the email with delay, signature, and CEO email cloning - This is where the magic happens!
async function sendEmail(ceoCfo, messageDrafts, signature, smtpConfig, cloneCeoEmail, nameMagxxic) {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            const transporter = nodemailer.createTransport(smtpConfig);
            const randomDelay = Math.floor(Math.random() * (15000 - 7000 + 1)) + 7000; // Increased random delay for added suspense!
            await new Promise(resolve => setTimeout(resolve, randomDelay));

            const randomMessage = messageDrafts[Math.floor(Math.random() * messageDrafts.length)];

            let fromName = ceoCfo.ceoName;
            let fromEmail = ceoCfo.ceoEmail;

            // Determine the 'from' field based on cloneCeoEmail - The art of deception!
            const from = cloneCeoEmail ? `${fromName} <${fromEmail}>` : fromName;

            const mailOptions = {
                from: from,
                to: ceoCfo.cfoEmail,
                subject: 'Urgent Financial Directive - Immediate Action Required', // Even MORE enticing!
                html: `
                    <p>Dear ${ceoCfo.cfoName},</p>
                    <p>${randomMessage}</p>
                    <p>Regards,</p>
                    <p>${ceoCfo.ceoName}</p>
                    <p>CEO, ${ceoCfo.companyName}</p>
                    <p>${signature}</p>
                    <p>${nameMagxxic}</p>
                `,
                replyTo: ceoCfo.ceoEmail, // Set the reply-to to the CEO's email - Clever, isn't it?
            };

            const info = await transporter.sendMail(mailOptions);
            const successMessage = `Email sent to ${ceoCfo.cfoName} via ${smtpConfig.host}: ${info.messageId}`;
            console.log(chalk.green(successMessage));
            logInfo(successMessage);
            return; // Exit the function if the email is sent successfully
        } catch (error) {
            retries++;
            const errorMessage = `Error sending email to ${ceoCfo.cfoName} via ${smtpConfig.host} (attempt ${retries}/${MAX_RETRIES}): ${error.message}`;
            console.error(chalk.red(errorMessage));
            logError(errorMessage);
            if (retries >= MAX_RETRIES) {
                const finalErrorMessage = `Failed to send email to ${ceoCfo.cfoName} after ${MAX_RETRIES} attempts.`;
                console.error(chalk.red(finalErrorMessage));
                logError(finalErrorMessage);
            }
        }
    }
}

module.exports = {
    sendEmail,
};
