const fs = require('fs');
const path = require('path');
const { showMagxxicBanner, getMagxxicAnswers, logCampaignStart } = require('./ui-sender');
const { readContactPairs, generateSenderEmail } = require('./file-utils');
const { getEmailService } = require('./email');
const chalk = require('chalk');
const { nameMagxxic, smtpConfigurations } = require('./config');

/**
 * Loads all HTML template files from a directory.
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function loadTemplates(dir) {
    if (!fs.existsSync(dir)) return [];
    try {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
        if (files.length === 0) return [];
        return files.map(f => fs.readFileSync(path.join(dir, f), 'utf-8'));
    } catch (error) {
        console.error(chalk.red(`[ERROR] Failed to load templates: ${error.message}`));
        return [];
    }
}

async function main() {
    showMagxxicBanner();

    // We'll use a modified getAnswers from ui.js or just stick with magxxic-ui for now
    // Actually, I'll merge the logic.
    const answers = await getMagxxicAnswers();
    process.env.MAIL_PROVIDER = answers.provider.toLowerCase();

    const emailService = getEmailService();

    // Template loading logic
    let templates = [];
    if (answers.provider === 'Direct') {
        templates = await loadTemplates(answers.templatesDir);
        if (templates.length === 0) {
            console.log(chalk.red(`[ERROR] No HTML templates found in ${answers.templatesDir}`));
            return;
        }
    } else {
        // For SMTP/SendGrid, we might use the drafts file as before
        const { readMessageDrafts } = require('./file-utils');
        templates = await readMessageDrafts('message_drafts.txt');
    }

    const contactPairs = await readContactPairs(answers.csvPath);
    if (contactPairs.length === 0) {
        console.log(chalk.red(`[ERROR] No valid recipients found in ${answers.csvPath}`));
        return;
    }

    if (process.env.MAIL_PROVIDER === 'smtp' && smtpConfigurations.length === 0) {
        console.log(chalk.red('SMTP provider is selected, but no SMTP configurations are defined in the .env file.'));
        return;
    }

    logCampaignStart({
        proxy: answers.proxy,
        ehloHost: answers.ehloHost,
        templateCount: templates.length,
        provider: answers.provider
    });

    console.log(chalk.cyan(`[GO] LAUNCHING CAMPAIGN for ${contactPairs.length} recipients`));

    let successCount = 0;
    let failCount = 0;
    let smtpIndex = 0;

    for (let i = 0; i < contactPairs.length; i++) {
        const pair = contactPairs[i];
        const progress = `[${String(i + 1).padStart(3, '0')}/${String(contactPairs.length).padStart(3, '0')}]`;

        // Pre-process templates for this recipient
        let processedTemplates = templates.map(t => {
            let processed = t;
            // Link Tracking
            if (answers.trackingBaseUrl) {
                processed = processed.replace(/href="([^"]+)"/g, (match, url) => {
                    const trackedUrl = `${answers.trackingBaseUrl}?url=${encodeURIComponent(url)}&to=${encodeURIComponent(pair.recipientEmail)}`;
                    return `href="${trackedUrl}"`;
                });
            }
            // Spam Filter Bypass (Randomization)
            if (answers.enableSpamFilterBypass) {
                const randomString = Math.random().toString(36).substring(7);
                processed = processed.replace('</body>', `<div style="display:none !important; font-size:1px;">${randomString}</div></body>`);
            }
            return processed;
        });

        if (answers.dryRun) {
            const senderEmail = generateSenderEmail(pair.senderName, pair.companyName);
            console.log(chalk.yellow(`${progress} DRY RUN -> ${pair.recipientEmail} (from: ${senderEmail} | ${answers.provider})`));
            successCount++;
        } else {
            const options = {
                contactPair: pair,
                messageDrafts: processedTemplates,
                cloneCeoEmail: true,
                nameMagxxic,
                replyTo: answers.replyTo,
                subject: answers.subject,
                minDelay: answers.minDelay,
                maxDelay: answers.maxDelay,
                attachmentPath: answers.attachmentPath,
                proxy: answers.proxy,
                ehloHost: answers.ehloHost,
                xOriginatingIp: answers.xOriginatingIp,
                customHeaders: answers.customHeaders
            };

            if (process.env.MAIL_PROVIDER === 'smtp') {
                options.smtpConfig = smtpConfigurations[smtpIndex % smtpConfigurations.length];
            }

            const result = await emailService.sendEmail(options);

            if (result) {
                successCount++;
            } else {
                failCount++;
            }
        }
        smtpIndex++;
    }

    console.log(chalk.green(' ' + '='.repeat(80)));
    console.log(chalk.green(` OPERATION COMPLETE - MAGXXIC SENDER V2.0 (${answers.provider})`));
    console.log(chalk.green(' ' + '='.repeat(80)));
    console.log(chalk.white(' [DELIVERY STATISTICS]'));
    console.log(chalk.white(`  DELIVERED:   ${successCount} emails`));
    console.log(chalk.red(`  FAILED:      ${failCount} emails`));
    console.log(chalk.white(`  TOTAL:       ${successCount + failCount} emails`));

    const total = successCount + failCount;
    const rate = total > 0 ? ((successCount / total) * 100).toFixed(1) : 0;

    let rateColor = chalk.red;
    if (rate > 90) rateColor = chalk.green;
    else if (rate > 70) rateColor = chalk.yellow;

    console.log(rateColor(`  SUCCESS RATE: ${rate}% ${rate == 100 ? '(EXCELLENT)' : ''}`));
}

main().catch(err => {
    console.error(chalk.red(`[FATAL] ${err.message}`));
    process.exit(1);
});
