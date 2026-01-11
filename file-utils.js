const fs = require('fs');
const readline = require('readline');

// Function to read CEO-CFO pairs from a CSV file - The juicier the data, the better!
async function readCeoCfoPairs(filePath) {
    const ceoCfoPairs = [];
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        const [ceoName, ceoEmail, companyName, cfoName, cfoEmail] = line.split(',');
        ceoCfoPairs.push({
            ceoName: ceoName.trim(),
            ceoEmail: ceoEmail.trim(),
            companyName: companyName.trim(),
            cfoName: cfoName.trim(),
            cfoEmail: cfoEmail.trim(),
        });
    }

    return ceoCfoPairs;
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
    readCeoCfoPairs,
    readMessageDrafts,
};
