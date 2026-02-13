const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');

// Function to read sender-recipient pairs from a CSV file.
async function readContactPairs(filePath) {
    const contactPairs = [];
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let lineNumber = 0;
    for await (const line of rl) {
        lineNumber++;
        const parts = line.split(',');

        // Validate the number of columns.
        if (parts.length !== 5) {
            console.log(chalk.yellow(`Warning: Skipping malformed line ${lineNumber} in ${filePath}. Expected 5 columns, but found ${parts.length}.`));
            continue;
        }

        const [senderName, companyName, position, recipientName, recipientEmail] = parts;

        // Check for empty fields.
        if (senderName && companyName && position && recipientName && recipientEmail) {
            contactPairs.push({
                senderName: senderName.trim(),
                companyName: companyName.trim(),
                position: position.trim(),
                recipientName: recipientName.trim(),
                recipientEmail: recipientEmail.trim(),
            });
        } else {
            console.log(chalk.yellow(`Warning: Skipping line ${lineNumber} in ${filePath} due to one or more empty fields.`));
        }
    }

    return contactPairs;
}

// Function to read message drafts from a text file - Injecting chaos one line at a time!
async function readMessageDrafts(filePath) {
    const messageDrafts = [];
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let currentDraft = '';
    for await (const line of rl) {
        if (line.trim() === '---') {
            if (currentDraft) {
                messageDrafts.push(currentDraft.trim());
                currentDraft = '';
            }
        } else {
            currentDraft += line + '\n';
        }
    }
    if (currentDraft) {
        messageDrafts.push(currentDraft.trim());
    }

    return messageDrafts;
}

// Function to generate a sender email address from a name and company.
function generateSenderEmail(senderName, companyName) {
    // Handle names with one or more parts.
    const nameParts = senderName.trim().toLowerCase().split(' ').filter(part => part);
    const emailName = nameParts.join('.');

    // Handle company names with one or more parts, removing suffixes like "Inc" or "LLC".
    const companyParts = companyName.trim().toLowerCase().split(' ');
    const primaryDomain = companyParts[0]; // Use the first word as the primary domain.

    // A more robust way to handle the domain would be to clean it up.
    const cleanDomain = primaryDomain.replace(/[,.]/g, ''); // Remove commas and periods.

    return `${emailName}@${cleanDomain}.com`;
}

module.exports = {
    readContactPairs,
    readMessageDrafts,
    generateSenderEmail,
};
