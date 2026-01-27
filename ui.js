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
            type: 'confirm',
            name: 'dryRun',
            message: 'Run in Dry Run mode (preview emails without sending)?',
            default: true,
        },
        {
            type: 'list',
            name: 'provider',
            message: 'Choose your email provider:',
            choices: ['SMTP', 'SendGrid'],
            default: 'SMTP',
        },
        {
            type: 'input',
            name: 'ceoCfoFilePath',
            message: 'Enter the path to the contact data file:',
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
            name: 'hideFromEmail',
            message: "Hide 'From' email address (show name only)?",
            default: true,
        },
        {
            type: 'input',
            name: 'replyTo',
            message: 'Enter the Reply-To email address:',
            validate: function (value) {
                const pass = value.match(
                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                );
                if (pass) {
                    return true;
                }
                return 'Please enter a valid email address.';
            },
        },
        {
            type: 'input',
            name: 'subject',
            message: 'Enter the email subject:',
            default: 'Urgent Financial Directive - Immediate Action Required',
        },
        {
            type: 'number',
            name: 'minDelay',
            message: 'Enter the minimum delay between emails (in seconds):',
            default: 7,
        },
        {
            type: 'number',
            name: 'maxDelay',
            message: 'Enter the maximum delay between emails (in seconds):',
            default: 15,
        },
        {
            type: 'input',
            name: 'attachmentPath',
            message: 'Enter the path to the attachment (leave blank for no attachment):',
        },
    ]);
}

module.exports = {
    showBanner,
    getAnswers,
};
