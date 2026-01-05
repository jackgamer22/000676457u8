# Multi-Provider SMS Sender

This project is a Flask-based API that allows you to send SMS messages through multiple providers. It's designed to be easily extensible with new providers.

## Features

*   Send SMS messages through various providers:
    *   Twilio
    *   Vonage (Nexmo)
    *   AWS SNS
    *   Plivo
    *   Messagebird
    *   Telnyx
    *   Telesign
    *   TextBelt (free tier)
*   API endpoints for:
    *   Listing available providers
    *   Sending SMS messages
    *   Generating random phone numbers (for testing)
    *   Checking phone number status (mock implementation)
    *   Filtering phone number carrier (mock implementation)
*   Rate limiting to prevent abuse.
*   Sanitized inputs to prevent script injection.

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
    Create a `.env` file in the root of the project and add the following environment variables for the providers you want to use:
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

4.  **Run the application:**
    ```bash
    python app.py
    ```

## API Usage

### List Providers

*   **Endpoint:** `/list_providers`
*   **Method:** `GET`
*   **Description:** Get a list of available SMS providers.
*   **Example:**
    ```bash
    curl http://localhost:5000/list_providers
    ```

### Send SMS

*   **Endpoint:** `/send_sms`
*   **Method:** `POST`
*   **Description:** Send an SMS message.
*   **Body:**
    ```json
    {
      "phone_number": "+1234567890",
      "message": "Hello, world!",
      "provider_id": "2"
    }
    ```
*   **Example:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"phone_number": "+1234567890", "message": "Hello, world!", "provider_id": "2"}' http://localhost:5000/send_sms
    ```

### Generate Phone Number

*   **Endpoint:** `/generate_number`
*   **Method:** `GET`
*   **Description:** Generate a random phone number.
*   **Example:**
    ```bash
    curl http://localhost:5000/generate_number
    ```

### Check Phone Number

*   **Endpoint:** `/check_number`
*   **Method:** `POST`
*   **Description:** Check the status of a phone number (mock implementation).
*   **Body:**
    ```json
    {
      "phone_number": "+1234567890"
    }
    ```
*   **Example:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"phone_number": "+1234567890"}' http://localhost:5000/check_number
    ```

### Filter Carrier

*   **Endpoint:** `/filter_carrier`
*   **Method:** `POST`
*   **Description:** Filter the carrier of a phone number (mock implementation).
*   **Body:**
    ```json
    {
      "phone_number": "+1234567890"
    }
    ```
*   **Example:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"phone_number": "+1234567890"}' http://localhost:5000/filter_carrier
    ```

### Check and Filter Carrier

*   **Endpoint:** `/check_and_filter`
*   **Method:** `POST`
*   **Description:** Check the status and filter the carrier of a phone number (mock implementation).
*   **Body:**
    ```json
    {
      "phone_number": "+1234567890"
    }
    ```
*   **Example:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"phone_number": "+1234567890"}' http://localhost:5000/check_and_filter
    ```
