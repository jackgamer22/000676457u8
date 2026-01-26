const { smtpConfigurations, signature, nameMagxxic } = require('./config');
const { showBanner, getAnswers } = require('./ui');
const { sendEmail } = require('./email');
const { readContactPairs, readMessageDrafts } = require('./file-utils');
const chalk = require('chalk');

async function main() {
    showBanner();

    const answers = await getAnswers();

    const contactPairs = await readContactPairs(answers.ceoCfoFilePath);
    const messageDrafts = await readMessageDrafts(answers.messageDraftsPath);

    if (contactPairs.length === 0) {
        console.log(chalk.yellow('No valid contact pairs found in the data file.'));
        return;
    }

    let smtpIndex = 0;

    // Iterate through each contact pair and send an email.
    for (const pair of contactPairs) {
        const smtpConfig = smtpConfigurations[smtpIndex % smtpConfigurations.length];

        await sendEmail(pair, messageDrafts, signature, smtpConfig, answers.cloneCeoEmail, nameMagxxic);

        smtpIndex++;

        // Pause between emails to avoid rate limiting.
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

main().catch(console.error);
