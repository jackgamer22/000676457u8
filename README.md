# Multi-Provider SMS Sender CLI

This project is a command-line interface (CLI) application that allows you to send SMS messages through multiple providers. It's designed to be easily extensible with new providers and features.

## Features

*   Send SMS messages through various providers:
    *   Twilio
    *   Vonage (formerly Nexmo)
    *   AWS SNS
    *   Plivo
    *   Messagebird
    *   Telnyx
    *   Telesign
    *   TextBelt (free tier)
*   Interactive CLI menu for easy operation.
*   Utility functions for:
    *   Checking provider API status (Twilio, Vonage).
    *   Generating random phone numbers for testing.
    *   Checking phone number status (mock implementation).
    *   Filtering phone number carrier (mock implementation).

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/multi-provider-sms-sender.git
    cd multi-provider-sms-sender
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set environment variables:**
    For the script to connect to the SMS provider APIs, you must set the appropriate environment variables. You can do this by creating a `.env` file in the root of the project and adding the following key-value pairs for the services you intend to use.

    *Note: The application will only initialize clients for which the required environment variables are present.*

    ```
    # Twilio
    TWILIO_ACCOUNT_SID=your_account_sid
    TWILIO_AUTH_TOKEN=your_auth_token
    TWILIO_PHONE_NUMBER=your_twilio_phone_number

    # Vonage (Nexmo)
    VONAGE_API_KEY=your_vonage_api_key
    VONAGE_API_SECRET=your_vonage_api_secret
    VONAGE_PHONE_NUMBER=your_vonage_phone_number

    # AWS SNS
    AWS_ACCESS_KEY_ID=your_aws_access_key_id
    AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
    AWS_REGION_NAME=your_aws_region

    # Plivo
    PLIVO_AUTH_ID=your_plivo_auth_id
    PLIVO_AUTH_TOKEN=your_plivo_auth_token
    PLIVO_PHONE_NUMBER=your_plivo_phone_number

    # Messagebird
    MESSAGEBIRD_API_KEY=your_messagebird_api_key
    MESSAGEBIRD_PHONE_NUMBER=your_messagebird_phone_number

    # Telnyx
    TELNYX_API_KEY=your_telnyx_api_key
    TELNYX_PHONE_NUMBER=your_telnyx_phone_number

    # Telesign
    TELESIGN_CUSTOMER_ID=your_telesign_customer_id
    TELESIGN_API_KEY=your_telesign_api_key
    TELESIGN_PHONE_NUMBER=your_telesign_phone_number
    ```

## Usage

Run the application from your terminal:
```bash
python app.py
```

This will launch the interactive menu.

```
 Note : I am not responsible for illegal use of the software
┌────────────────────────────────────────────────────────────────────────────────┐
│ [ 1 ] Nexmo Bulk SMS Sender          [ 9  ] Telnyx Bulk SMS Sender         │
│ [ 2 ] Twilio Bulk SMS Sender         [ 10 ] Telesign Bulk SMS Sender       │
│ [ 3 ] Plivo Bulk SMS Sender          [ 11 ] Amazon SNS Bulk SMS Sender     │
│ [ 4 ] Messagebird Bulk SMS Sender    [ 12 ] Phone Number Generator         │
│ [ 5 ] Send99 Bulk SMS Sender         [ 13 ] Phone Checker [Live/Die]       │
│ [ 6 ] Proovl Bulk SMS Sender         [ 14 ] Phone checker Filter Carrier   │
│ [ 7 ] TextBelt Bulk SMS Sender       [ 15 ] Option 13 + 14                 │
│ [ 8 ] Nexmo Api checker              [ 16 ] Twilio api Checker             │
└────────────────────────────────────────────────────────────────────────────────┘
Select :
```

Enter the number corresponding to the action you wish to perform and follow the on-screen prompts. To exit the application, type `exit` or `quit`.
