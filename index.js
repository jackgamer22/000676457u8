const { smtpConfigurations, nameMagxxic } = require('./config');
const { showBanner, getAnswers } = require('./ui');
const { getEmailService } = require('./email');
const { readContactPairs, readMessageDrafts } = require('./file-utils');
const chalk = require('chalk');

async function main() {
    showBanner();

    const answers = await getAnswers();
    process.env.MAIL_PROVIDER = answers.provider.toLowerCase();

    const emailService = getEmailService();

    const contactPairs = await readContactPairs(answers.ceoCfoFilePath);
    const messageDrafts = await readMessageDrafts(answers.messageDraftsPath);

    if (contactPairs.length === 0) {
        console.log(chalk.yellow('No valid contact pairs found in the data file.'));
        return;
    }

    if (process.env.MAIL_PROVIDER === 'smtp' && smtpConfigurations.length === 0) {
        console.log(chalk.red('SMTP provider is selected, but no SMTP configurations are defined in the .env file.'));
        return;
    }

    let smtpIndex = 0;
    let successCount = 0;
    let failCount = 0;

    // Iterate through each contact pair and send an email.
    for (const pair of contactPairs) {
        let result = false;
        if (answers.dryRun) {
            console.log(chalk.yellow('--- Dry Run: Email Preview ---'));
            console.log(chalk.cyan(`To: ${pair.recipientName} <${pair.recipientEmail}>`));
            console.log(chalk.cyan(`From: ${pair.senderName} <${pair.senderEmail}>`));
            console.log(chalk.cyan(`Subject: ${answers.subject}`));
            console.log(chalk.cyan(`Reply-To: ${answers.replyTo}`));
            if (answers.attachmentPath) {
                console.log(chalk.cyan(`Attachment: ${answers.attachmentPath}`));
            }
            console.log(chalk.yellow('----------------------------'));
            result = true;
        } else {
            if (process.env.MAIL_PROVIDER === 'smtp') {
                const smtpConfig = smtpConfigurations[smtpIndex % smtpConfigurations.length];
                result = await emailService.sendEmail(pair, messageDrafts, smtpConfig, !answers.hideFromEmail, nameMagxxic, answers.replyTo, answers.subject, answers.minDelay, answers.maxDelay, answers.attachmentPath);
            } else {
                result = await emailService.sendEmail(pair, messageDrafts, nameMagxxic, answers.replyTo, answers.subject, answers.minDelay, answers.maxDelay, answers.attachmentPath);
            }
        }

        if (result) {
            successCount++;
        } else {
            failCount++;
        }

        smtpIndex++;

        // Pause between emails to avoid rate limiting.
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(chalk.green('--- Sending Complete ---'));
    console.log(chalk.green(`Successful emails: ${successCount}`));
    console.log(chalk.red(`Failed emails: ${failCount}`));
    console.log(chalk.blue('Check sender.log for more details.'));
    console.log(chalk.green('------------------------'));
}

main().catch(console.error);
