# Telegram Email Bot

A powerful Telegram bot to manage and automate your email campaigns directly from your Telegram account.

## Features

- **Dynamic Email Campaigns:** Set the from name, from email, and subject for your email campaigns.
- **HTML Templates:** Use HTML files for both the email body and the attachment.
- **Personalized PDF Attachments:** Automatically generate personalized PDF attachments from an HTML template. The PDF can include the recipient's email address.
- **Contact Management:** Easily upload and manage your contact lists.
- **Flexible Configuration:**
    - Choose from a list of pre-configured "from" emails and subjects.
    - Use multiple SMTP servers for sending emails (rotates through the list).
- **Dynamic PDF Filenames:** Customize the name of the generated PDF attachment with dynamic tags like `{{date}}` and `{{domain}}`.
- **Rate Limiting:** Control the email sending rate with configurable delays between emails and a longer "pulse" delay after a certain number of emails.
- **Random Number Tags:** Insert random numbers of a specified length into the 'From' name, subject, and email content.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)

## Setup and Configuration

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd telegram-email-bot
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

    ### For Windows Users
    A `setup.bat` script is provided to automate the setup process. Simply double-click the `setup.bat` file to run it. The script will:
    - Check if Node.js and npm are installed.
    - Install the required dependencies.
    - Create the `.env` and `config.json` files if they don't exist.
    - Open the configuration files in Notepad for you to edit.

3.  **Create the `.env` file:**
    Create a file named `.env` in the root of the project and add your Telegram Bot Token and your Telegram User ID:
    ```
    TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
    TELEGRAM_USER_ID=YOUR_TELEGRAM_USER_ID
    ```

4.  **Configure `config.json`:**
    Open the `config.json` file and configure your SMTP settings. You can add one or more SMTP server configurations to the `smtp_settings` array.
    ```json
    {
        "from_emails": [
            "example.sender1@yourdomain.com",
            "example.sender2@yourdomain.com"
        ],
        "subjects": [
            "Your weekly update",
            "A special offer for you"
        ],
        "smtp_settings": [
            {
                "host": "smtp1.example.com",
                "port": 587,
                "secure": false,
                "auth": {
                    "user": "your_smtp_user1",
                    "pass": "your_smtp_password1"
                }
            }
        ]
    }
    ```

## Running the Bot

Once you have completed the setup and configuration, you can start the bot with the following command:
```bash
node index.js
```

## Bot Commands

Here is a complete list of the available bot commands:

**Configuration Commands:**
- `/fromname <Your Name>` - Set a specific 'From' name.
- `/frommail <your@email.com>` - Set a specific 'From' email.
- `/subject <Your Subject>` - Set a specific subject line.
- `/setpdfname <filename.pdf>` - Set the name for the PDF attachment.
- `/setdelay <seconds>` - Set the delay (in seconds) between each email.
- `/setpulsecount <count>` - Set the number of emails to send before a longer pause.
- `/setpulsedelay <minutes>` - Set the duration (in minutes) of the longer pause.
- `/selectfrom` - Choose a 'From' email from config.
- `/selectsubject` - Choose a subject from config.

**File Commands:**
1. Upload a file (.html, .txt).
2. Use one of these commands to assign it:
   - `/setletter` - Assigns the last uploaded file as the HTML letter.
   - `/setattachment` - Assigns the last uploaded file as the HTML source for the PDF attachment. The bot will automatically convert this HTML to a PDF. You can use the placeholder `{{email}}` in this file to insert the recipient's email address.
   - `/setcontacts` - Assigns the last uploaded .txt file as the contact list.

**Dynamic Tags for PDF Filename:**
You can use the following tags in the PDF filename (set via `/setpdfname`):
- `{{date}}` - Replaced with the current date (YYYY-MM-DD).
- `{{domain}}` - Replaced with the recipient's email domain.
   Example: `/setpdfname Report-{{domain}}-{{date}}.pdf`

**Dynamic Random Number Tag:**
You can use the following tag to insert a random number into the 'From' name, subject, email body, and PDF attachment:
- `{{random_numbX}}` - Replaced with a random number with X digits.
  Example: `{{random_numb5}}` will be replaced by a 5-digit random number.

**Action Commands:**
- `/send` - Show a preview of the campaign and prepare to send.
- `/confirm` - (Only after /send) Starts the email campaign.
- `/status` - Check the progress of the current campaign.
- `/cancel` - Stop a running campaign.
