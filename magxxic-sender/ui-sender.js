const figlet = require('figlet');
const chalk = require('chalk');
const inquirer = require('inquirer');

/**
 * Displays the Magxxic Sender banner and system information.
 */
function showMagxxicBanner() {
    // Top logo part
    console.log(chalk.red(`    @@@@    @@@@@@@@@@@@@@@@@@@@    @@@@`));
    console.log(chalk.red(`    @@@@    @@@@@@@@@@@@@@@@@@@@    @@@@`));
    console.log(chalk.red(`            @@@@@@@@@@@@`));
    console.log(chalk.red(`            @@@@@@@@@@@@`));
    console.log(chalk.red(`            @@@@@@@@@@@@`));
    console.log(chalk.red(`    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@`));
    console.log(chalk.red(`    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@`));

    // Main text banner
    const bannerText = figlet.textSync('Magxxic Sender', { font: 'Slant' });
    console.log(chalk.red(bannerText));

    console.log(chalk.green(' >>> PROXY-ONLY DIRECT-TO-MX DELIVERY SYSTEM - STATUS: ARMED <<<'));
    console.log(chalk.green(' [RFC-2822] [DKIM-SIGNED] [SOCKS5-CHAIN] [ZERO-SMTP-RELAY]'));
    console.log(chalk.green(' VERSION 2.0.0 | BUILD 2026-02-08 | SCORPION PROTOCOL'));
    console.log(chalk.green(' ' + '='.repeat(80)));
}

/**
 * Prompts the user for configuration options.
 */
async function getMagxxicAnswers() {
    return await inquirer.prompt([
        {
            type: 'confirm',
            name: 'dryRun',
            message: 'Enable DRY RUN mode?',
            default: false,
        },
        {
            type: 'list',
            name: 'provider',
            message: 'Choose Delivery Mode:',
            choices: ['Direct', 'SMTP', 'SendGrid'],
            default: 'Direct',
        },
        {
            type: 'input',
            name: 'proxy',
            message: 'SOCKS5 Proxy (e.g. socks5://127.0.0.1:9050, leave blank for NONE):',
            when: (answers) => answers.provider === 'Direct',
        },
        {
            type: 'input',
            name: 'ehloHost',
            message: 'EHLO Hostname:',
            default: 'backstage.co.jp',
            when: (answers) => answers.provider === 'Direct',
        },
        {
            type: 'input',
            name: 'csvPath',
            message: 'Recipients CSV path:',
            default: 'ceo_cfo_data.csv',
        },
        {
            type: 'input',
            name: 'templatesDir',
            message: 'Templates directory (will load all .html files):',
            default: 'format',
            when: (answers) => answers.provider === 'Direct',
        },
        {
            type: 'input',
            name: 'subject',
            message: 'Email Subject:',
            default: 'Immediate Attention Required',
        },
        {
            type: 'input',
            name: 'replyTo',
            message: 'Reply-To Address:',
        },
        {
            type: 'number',
            name: 'minDelay',
            message: 'Min delay (seconds):',
            default: 5,
        },
        {
            type: 'number',
            name: 'maxDelay',
            message: 'Max delay (seconds):',
            default: 10,
        },
        {
            type: 'input',
            name: 'attachmentPath',
            message: 'Attachment path (optional):',
        }
    ]);
}

/**
 * Logs campaign information at the start of a run.
 */
function logCampaignStart(config) {
    console.log(chalk.green(`MODE: ${config.provider} (${config.proxy ? 'Proxy Enabled' : 'Direct/No Proxy'})`));
    if (config.provider === 'Direct') {
        console.log(chalk.green(`Proxy: ${config.proxy || 'DISABLED'}`));
        console.log(chalk.green(`EHLO: ${config.ehloHost}`));
        console.log(chalk.green(`IP-HIDING: ${config.proxy ? 'ENABLED' : 'DISABLED'}`));
    }
    console.log(chalk.green(`TEMPLATES: ${config.templateCount} loaded`));
    console.log(chalk.green(' ' + '='.repeat(80)));
}

module.exports = {
    showMagxxicBanner,
    getMagxxicAnswers,
    logCampaignStart
};
