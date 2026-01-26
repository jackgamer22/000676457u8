const fs = require('fs');
const readline = require('readline');

// Function to read sender-recipient pairs from a CSV file.
async function readContactPairs(filePath) {
    const contactPairs = [];
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        // Assuming CSV format: senderName,senderEmail,companyName,recipientName,recipientEmail
        const [senderName, senderEmail, companyName, recipientName, recipientEmail] = line.split(',');
        if (senderName && senderEmail && companyName && recipientName && recipientEmail) {
            contactPairs.push({
                senderName: senderName.trim(),
                senderEmail: senderEmail.trim(),
                companyName: companyName.trim(),
                recipientName: recipientName.trim(),
                recipientEmail: recipientEmail.trim(),
            });
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

module.exports = {
    readContactPairs,
    readMessageDrafts,
};
