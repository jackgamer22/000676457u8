const nodemailer = require('nodemailer');
const { logInfo, logError } = require('./logger');

const MAX_RETRIES = 3;

// Function to send the email with delay and signature
async function sendEmail(ceo, cfo, messageDrafts, signature, smtpConfig) {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            const transporter = nodemailer.createTransport(smtpConfig);
            const randomDelay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000; // Random delay between 5 to 10 seconds
            await new Promise(resolve => setTimeout(resolve, randomDelay));

            let randomMessage = messageDrafts[Math.floor(Math.random() * messageDrafts.length)];
            randomMessage = randomMessage.replace(/{ceoName}/g, ceo.ceoName)
                                         .replace(/{cfoName}/g, cfo.cfoName)
                                         .replace(/{companyName}/g, cfo.companyName);

            const fromAddress = process.env.CLONE_CEO_EMAIL === 'true'
                ? `${ceo.ceoName} <${ceo.ceoEmail}>`
                : `"${ceo.ceoName}" <${smtpConfig.auth.user}>`;

            const mailOptions = {
                from: fromAddress,
                to: cfo.cfoEmail,
                replyTo: ceo.ceoEmail,
                subject: 'Urgent Financial Directive', // More enticing subject
                html: `
                    <p>Dear ${cfo.cfoName},</p>
                    <p>${randomMessage}</p>
                    <p>Regards,</p>
                    <p>${ceo.ceoName}</p>
                    <p>CEO, ${cfo.companyName}</p>
                    <p>${signature}</p>
                `,
            };

            const info = await transporter.sendMail(mailOptions);
            const successMessage = `Email sent to ${cfo.cfoName} via ${smtpConfig.host}: ${info.messageId}`;
            console.log(successMessage);
            logInfo(successMessage);
            return; // Exit the function if the email is sent successfully
        } catch (error) {
            retries++;
            const errorMessage = `Error sending email to ${cfo.cfoName} via ${smtpConfig.host} (attempt ${retries}/${MAX_RETRIES}): ${error.message}`;
            console.error(errorMessage);
            logError(errorMessage);
            if (retries >= MAX_RETRIES) {
                const finalErrorMessage = `Failed to send email to ${cfo.cfoName} after ${MAX_RETRIES} attempts.`;
                console.error(finalErrorMessage);
                logError(finalErrorMessage);
            }
        }
    }
}

module.exports = {
    sendEmail,
};
