# Magxxic Sender

This project is a command-line interface (CLI) application that allows you to send SMS messages to multiple recipients through various providers.

## Features

*   **Bulk SMS Sending:** Send SMS messages to a comma-separated list of phone numbers.
*   **Multi-Provider Support:**
    *   Twilio
    *   Vonage (formerly Nexmo)
    *   AWS SNS
    *   Plivo
    *   Messagebird
    *   Telnyx
    *   Telesign
    *   TextBelt (free tier)
*   **Interactive CLI:** A user-friendly, menu-driven interface for easy operation.
*   **Utility Functions:**
    *   Check provider API status (Twilio, Vonage).
    *   Generate random phone numbers for testing.
    *   Check phone number status (mock implementation).
    *   Filter phone number carrier (mock implementation).

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
    Create a `.env` file in the root of the project and add the API credentials for the services you intend to use. The application will only initialize clients for which the required environment variables are present.

    ```
    # Twilio
    TWILIO_ACCOUNT_SID=your_account_sid
    TWILIO_AUTH_TOKEN=your_auth_token
    TWILIO_PHONE_NUMBER=your_twilio_phone_number

    # Vonage (Nexmo)
    VONAGE_API_KEY=your_vonage_api_key
    VONAGE_API_SECRET=your_vonage_api_secret
    VONAGE_PHONE_NUMBER=your_vonage_phone_number

    # ... (add other provider keys as needed)
    ```

## Usage

Run the application from your terminal:
```bash
python app.py
```

This will launch the interactive menu for the **Magxxic sender**.

```
                   Magxxic sender
 Note : I am not responsible for illegal use of the software
┌────────────────────────────────────────────────────────────────────────────────┐
│ [ 1 ] Nexmo Bulk SMS Sender          [ 9  ] Telnyx Bulk SMS Sender         │
│ [ 2 ] Twilio Bulk SMS Sender         [ 10 ] Telesign Bulk SMS Sender       │
│ [ 3 ] Plivo Bulk SMS Sender          [ 11 ] Amazon SNS Bulk SMS Sender     │
│ [ 4 ] Messagebird Bulk SMS Sender    [ 12 ] Phone Number Generator         │
│ [ 7 ] TextBelt Bulk SMS Sender       [ 13 ] Phone Checker [Live/Die]       │
│ [ 8 ] Nexmo Api checker              [ 14 ] Phone checker Filter Carrier   │
│                                      [ 15 ] Option 13 + 14                │
│                                      [ 16 ] Twilio api Checker            │
└────────────────────────────────────────────────────────────────────────────────┘
Select :
```

To send an SMS, select a provider. You will be prompted to enter one or more phone numbers (separated by commas) and your message.

**Example Input for Multiple Numbers:**
```
Enter phone number(s) (comma-separated for multiple): +1234567890, +1987654321, +15551234567
Enter message: This is a test message.
```

To exit the application, type `exit` or `quit`.
