const { smtpConfigurations, signature, nameMagxxic } = require('./config');
const { showBanner, getAnswers } = require('./ui');
const { sendEmail } = require('./email');
const { readCeoCfoPairs, readMessageDrafts } = require('./file-utils');
const chalk = require('chalk');

async function main() {
    showBanner();

    const answers = await getAnswers();

    const ceoCfoPairs = await readCeoCfoPairs(answers.ceoCfoFilePath);

    // Group CEO-CFO pairs by company - Divide and conquer!
    const companyMap = new Map();
    ceoCfoPairs.forEach(pair => {
        if (!companyMap.has(pair.companyName)) {
            companyMap.set(pair.companyName, []);
        }
        companyMap.get(pair.companyName).push(pair);
    });

    const messageDrafts = await readMessageDrafts(answers.messageDraftsPath);
    let smtpIndex = 0;

    // Iterate through each company - Spreading chaos far and wide!
    for (const [companyName, pairs] of companyMap) {
        // Ensure there's a CEO and CFO for this company - Can't leave anyone out!
        if (pairs.length >= 2) {
            const ceo = pairs[0]; // Assuming the first entry is the CEO
            const cfo = pairs.find(pair => pair.cfoEmail); // Find the CFO entry

            if (ceo && cfo) {
                const smtpConfig = smtpConfigurations[smtpIndex % smtpConfigurations.length];
                await sendEmail(cfo, messageDrafts, signature, smtpConfig, answers.cloneCeoEmail, nameMagxxic); // Send to the CFO using CEO's details - Genius!
                smtpIndex++;
                await new Promise(resolve => setTimeout(resolve, 2000)); // Pause for 2 seconds between emails - Gotta savor the moment!
            } else {
                console.log(chalk.yellow(`Skipping ${companyName} due to missing CEO or CFO.`));
            }
        } else {
            console.log(chalk.yellow(`Skipping ${companyName} due to insufficient data.`));
        }
    }
}

main().catch(console.error);
