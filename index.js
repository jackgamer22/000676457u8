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

    // Iterate through each contact pair and send an email.
    for (const pair of contactPairs) {
        if (process.env.MAIL_PROVIDER === 'smtp') {
            const smtpConfig = smtpConfigurations[smtpIndex % smtpConfigurations.length];
            await emailService.sendEmail(pair, messageDrafts, smtpConfig, answers.cloneCeoEmail, nameMagxxic, answers.replyTo);
        } else {
            await emailService.sendEmail(pair, messageDrafts, nameMagxxic, answers.replyTo);
        }

        smtpIndex++;

        // Pause between emails to avoid rate limiting.
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

main().catch(console.error);
