const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');

const SETTINGS_FILE = 'settings.json';
const CONTACTS_FILE = 'contacts.txt';
const CONFIG_FILE = 'config.json';
const STATUS_FILE = 'sending_status.json';

function processRandomNumberTags(text) {
    if (!text) return text;
    return text.replace(/{{random_numb(\d+)}}/g, (match, digits) => {
        const numDigits = parseInt(digits, 10);
        if (isNaN(numDigits) || numDigits <= 0) {
            return match; // Return the original tag if the number of digits is invalid
        }
        const min = Math.pow(10, numDigits - 1);
        const max = Math.pow(10, numDigits) - 1;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return String(randomNumber);
    });
}

async function main() {
    let status = {
        total: 0,
        sent: 0,
        success: 0,
        failed: 0,
        last_message: 'Starting...',
        start_time: new Date().toISOString(),
        end_time: null
    };

    try {
        // --- 1. Load Configuration ---
        const settings = JSON.parse(await fs.readFile(SETTINGS_FILE, 'utf8'));
        const config = JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8'));
        const contacts = (await fs.readFile(CONTACTS_FILE, 'utf8'))
            .split('\n')
            .filter(line => line.trim().includes('@'));

        status.total = contacts.length;
        await fs.writeFile(STATUS_FILE, JSON.stringify(status, null, 2));

        if (contacts.length === 0) {
            throw new Error("Contact list is empty.");
        }

        // --- 2. Setup Services ---
        const transporters = config.smtp_settings.map(smtpConfig => nodemailer.createTransport(smtpConfig));
        if (transporters.length === 0) {
            throw new Error("No SMTP settings found in config.json.");
        }
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const letterHtml = await fs.readFile(settings.letter_file, 'utf8');
        const attachmentHtmlTemplate = await fs.readFile(settings.attachment_file, 'utf8');

        // --- 3. Process and Send Emails ---
        for (const contact of contacts) {
            const recipientEmail = contact.trim();
            status.last_message = `Processing ${recipientEmail}...`;
            await fs.writeFile(STATUS_FILE, JSON.stringify(status, null, 2));

            try {
                // --- 3a. Generate PDF ---
                let personalizedHtml = attachmentHtmlTemplate.replace(/{{email}}/g, recipientEmail);
                personalizedHtml = processRandomNumberTags(personalizedHtml); // Process random number tags
                const page = await browser.newPage();
                await page.setContent(personalizedHtml, { waitUntil: 'networkidle0' });
                const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
                await page.close();

                // --- 3b. Send Email ---
                const transporter = transporters[status.sent % transporters.length];

                const fromName = processRandomNumberTags(settings.from_name);
                const subject = processRandomNumberTags(settings.subject || config.subjects[status.sent % config.subjects.length]);
                const processedLetterHtml = processRandomNumberTags(letterHtml);

                let filename = settings.pdf_filename || 'attachment.pdf';

                // Handle {{date}} tag
                if (filename.includes('{{date}}')) {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;
                    filename = filename.replace(/{{date}}/g, formattedDate);
                }

                // Handle {{domain}} tag
                if (filename.includes('{{domain}}')) {
                    const domain = recipientEmail.split('@')[1] || 'domain';
                    filename = filename.replace(/{{domain}}/g, domain);
                }

                await transporter.sendMail({
                    from: `"${fromName}" <${settings.from_email || config.from_emails[status.sent % config.from_emails.length]}>`,
                    to: recipientEmail,
                    subject: subject,
                    html: processedLetterHtml,
                    attachments: [{
                        filename: filename,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }]
                });

                status.success++;
                status.last_message = `Successfully sent to ${recipientEmail}`;
            } catch (err) {
                status.failed++;
                status.last_message = `Failed to send to ${recipientEmail}: ${err.message}`;
            } finally {
                status.sent++;
                await fs.writeFile(STATUS_FILE, JSON.stringify(status, null, 2));
            }

            // --- 3c. Apply Delays ---
            if (settings.delay_between_emails > 0) {
                await new Promise(resolve => setTimeout(resolve, settings.delay_between_emails * 1000));
            }
            if (settings.pulse_email_count > 0 && status.sent > 0 && status.sent % settings.pulse_email_count === 0 && settings.pulse_delay_minutes > 0) {
                status.last_message = `Reached ${status.sent} emails. Pausing for ${settings.pulse_delay_minutes} minutes...`;
                await fs.writeFile(STATUS_FILE, JSON.stringify(status, null, 2));
                await new Promise(resolve => setTimeout(resolve, settings.pulse_delay_minutes * 60 * 1000));
            }
        }

        await browser.close();
        status.last_message = "All emails processed.";

    } catch (error) {
        status.last_message = `A critical error occurred: ${error.message}`;
        console.error(error);
    } finally {
        status.end_time = new Date().toISOString();
        await fs.writeFile(STATUS_FILE, JSON.stringify(status, null, 2));
        process.exit(0);
    }
}

main();
