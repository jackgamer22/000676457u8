const figlet = require('figlet');
const chalk = require('chalk');
const inquirer = require('inquirer');

function showBanner() {
    const magxxicPart = figlet.textSync('Magxxic', { font: 'Graffiti' });
    const senderPart = figlet.textSync('S3nder', { font: 'Standard' });
    console.log(chalk.red(magxxicPart));
    console.log(chalk.red(senderPart));
}

async function getAnswers() {
    return await inquirer.prompt([
        {
            type: 'input',
            name: 'ceoCfoFilePath',
            message: 'Enter the path to the CEO-CFO data file:',
            default: 'ceo_cfo_data.csv',
        },
        {
            type: 'input',
            name: 'messageDraftsPath',
            message: 'Enter the path to the message drafts file:',
            default: 'message_drafts.txt',
        },
        {
            type: 'confirm',
            name: 'cloneCeoEmail',
            message: 'Clone CEO email address?',
            default: process.env.CLONE_CEO_EMAIL === 'true',
        },
    ]);
}

module.exports = {
    showBanner,
    getAnswers,
};
