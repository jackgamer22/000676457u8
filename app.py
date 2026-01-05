import os
import logging
import time
import random
from flask import Flask, request, jsonify
from twilio.rest import Client as TwilioClient
import vonage
import boto3
import requests  # For HTTP requests
import plivo
from plivo.exceptions import PlivoRestError
import messagebird
import telnyx
from telesign.messaging import MessagingClient

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Environment variables
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")

VONAGE_API_KEY = os.environ.get("VONAGE_API_KEY")
VONAGE_API_SECRET = os.environ.get("VONAGE_API_SECRET")
VONAGE_PHONE_NUMBER = os.environ.get("VONAGE_PHONE_NUMBER")

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION_NAME = os.environ.get("AWS_REGION_NAME")

PLIVO_AUTH_ID = os.environ.get("PLIVO_AUTH_ID")
PLIVO_AUTH_TOKEN = os.environ.get("PLIVO_AUTH_TOKEN")
PLIVO_PHONE_NUMBER = os.environ.get("PLIVO_PHONE_NUMBER")

MESSAGEBIRD_API_KEY = os.environ.get("MESSAGEBIRD_API_KEY")
MESSAGEBIRD_PHONE_NUMBER = os.environ.get("MESSAGEBIRD_PHONE_NUMBER")

TELNYX_API_KEY = os.environ.get("TELNYX_API_KEY")
TELNYX_PHONE_NUMBER = os.environ.get("TELNYX_PHONE_NUMBER")

TELESIGN_CUSTOMER_ID = os.environ.get("TELESIGN_CUSTOMER_ID")
TELESIGN_API_KEY = os.environ.get("TELESIGN_API_KEY")
TELESIGN_PHONE_NUMBER = os.environ.get("TELESIGN_PHONE_NUMBER")

# Initialize clients
twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN else None
vonage_client = vonage.Client(key=VONAGE_API_KEY, secret=VONAGE_API_SECRET) if VONAGE_API_KEY and VONAGE_API_SECRET else None
sns_client = boto3.client('sns', aws_access_key_id=AWS_ACCESS_KEY_ID, aws_secret_access_key=AWS_SECRET_ACCESS_KEY, region_name=AWS_REGION_NAME) if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_REGION_NAME else None
plivo_client = plivo.RestClient(PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN) if PLIVO_AUTH_ID and PLIVO_AUTH_TOKEN else None
messagebird_client = messagebird.Client(MESSAGEBIRD_API_KEY) if MESSAGEBIRD_API_KEY else None
if TELNYX_API_KEY:
    telnyx.api_key = TELNYX_API_KEY
telesign_client = MessagingClient(TELESIGN_CUSTOMER_ID, TELESIGN_API_KEY) if TELESIGN_CUSTOMER_ID and TELESIGN_API_KEY else None

# Rate limiting
last_sent_time = 0
rate_limit_seconds = 1  # Adjust as needed

# Flask app
app = Flask(__name__)

# API Checker Functions
def check_twilio_api():
    """Verify Twilio API credentials."""
    try:
        if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
            return False, "Twilio credentials not configured."
        twilio_client.api.accounts(TWILIO_ACCOUNT_SID).fetch()  # Try fetching account details
        return True, "Twilio API is working."
    except Exception as e:
        return False, f"Twilio API check failed: {e}"

def check_vonage_api():
    """Verify Vonage API credentials."""
    try:
        if not VONAGE_API_KEY or not VONAGE_API_SECRET:
            return False, "Vonage credentials not configured."
        vonage_client.account.get_balance()  # Try fetching account balance
        return True, "Vonage API is working."
    except Exception as e:
        return False, f"Vonage API check failed: {e}"

def check_aws_sns_api():
    """Verify AWS SNS API credentials."""
    try:
        if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY or not AWS_REGION_NAME:
            return False, "AWS SNS credentials not configured."
        sns_client.get_sms_attributes(attributes=['DefaultSMSType'])  # Try fetching SMS attributes
        return True, "AWS SNS API is working."
    except Exception as e:
        return False, f"AWS SNS API check failed: {e}"

def check_plivo_api():
    """Verify Plivo API credentials."""
    try:
        if not PLIVO_AUTH_ID or not PLIVO_AUTH_TOKEN:
            return False, "Plivo credentials not configured."
        plivo_client.account.get()
        return True, "Plivo API is working."
    except PlivoRestError as e:
        return False, f"Plivo API check failed: {e}"

def check_messagebird_api():
    """Verify Messagebird API credentials."""
    try:
        if not MESSAGEBIRD_API_KEY:
            return False, "Messagebird credentials not configured."
        messagebird_client.balance()
        return True, "Messagebird API is working."
    except messagebird.client.ErrorException as e:
        return False, f"Messagebird API check failed: {e}"

def check_telnyx_api():
    """Verify Telnyx API credentials."""
    try:
        if not TELNYX_API_KEY:
            return False, "Telnyx credentials not configured."
        telnyx.Balance.retrieve()
        return True, "Telnyx API is working."
    except telnyx.error.APIError as e:
        return False, f"Telnyx API check failed: {e}"

def check_telesign_api():
    """Verify Telesign API credentials."""
    try:
        if not TELESIGN_CUSTOMER_ID or not TELESIGN_API_KEY:
            return False, "Telesign credentials not configured."
        response = telesign_client.status("12345")
        if response.ok:
            return True, "Telesign API is working."
        else:
            return False, f"Telesign API check failed: {response.body}"
    except Exception as e:
        return False, f"Telesign API check failed: {e}"

# Available SMS Providers
SMS_PROVIDERS = {
    "1": {"name": "Nexmo", "function": send_sms_vonage, "api_check": check_vonage_api},
    "2": {"name": "Twilio", "function": send_sms_twilio, "api_check": check_twilio_api},
    "3": {"name": "Plivo", "function": send_sms_plivo, "api_check": check_plivo_api},
    "4": {"name": "Messagebird", "function": send_sms_messagebird, "api_check": check_messagebird_api},
    "5": {"name": "Send99", "function": None, "api_check": None},  # Placeholder - implement Send99
    "6": {"name": "Proovl", "function": None, "api_check": None},  # Placeholder - implement Proovl
    "7": {"name": "TextBelt", "function": send_sms_textbelt, "api_check": None},
    "8": {"name": "Nexmo Api checker", "function": None, "api_check": check_vonage_api},
    "9": {"name": "Telnyx", "function": send_sms_telnyx, "api_check": check_telnyx_api},
    "10": {"name": "Telesign", "function": send_sms_telesign, "api_check": check_telesign_api},
    "11": {"name": "Amazon SNS", "function": send_sms_aws_sns, "api_check": check_aws_sns_api},
    "12": {"name": "Phone Number Generator", "function": None, "api_check": None},
    "13": {"name": "Phone Checker [Live/Die]", "function": None, "api_check": None},
    "14": {"name": "Phone checker Filter Carrier", "function": None, "api_check": None},
    "15": {"name": "Option 13 + 14", "function": None, "api_check": None},
    "16": {"name": "Twilio api Checker", "function": None, "api_check": check_twilio_api},
}

def generate_phone_number():
    """Generate a random phone number."""
    # This is a simple example. In a real-world scenario, you might want to use a library to generate valid phone numbers.
    return f"+1{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(1000, 9999)}"

def check_phone_number(phone_number):
    """Check if a phone number is live or dead."""
    # This is a placeholder. A real implementation would require a service that can check phone number status.
    # For demonstration purposes, we'll randomly return "live" or "dead".
    return random.choice(["live", "dead"])

def filter_carrier(phone_number):
    """Filter the carrier of a phone number."""
    # This is a placeholder. A real implementation would require a service that can look up carrier information.
    # For demonstration purposes, we'll return a random carrier.
    carriers = ["AT&T", "Verizon", "T-Mobile", "Sprint"]
    return random.choice(carriers)

def check_and_filter_carrier(phone_number):
    """Check if a phone number is live and filter its carrier."""
    status = check_phone_number(phone_number)
    if status == "live":
        carrier = filter_carrier(phone_number)
        return {"status": status, "carrier": carrier}
    else:
        return {"status": status}

def send_sms_twilio(phone_number, message):
    """Send SMS using Twilio."""
    try:
        if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
            raise ValueError("Twilio credentials not configured.")

        message = twilio_client.messages.create(
            to=phone_number,
            from_=TWILIO_PHONE_NUMBER,
            body=message
        )
        logging.info(f"Twilio SMS sent to {phone_number}, SID: {message.sid}")
        return True
    except Exception as e:
        logging.error(f"Twilio SMS failed to {phone_number}: {e}")
        return False

def send_sms_vonage(phone_number, message):
    """Send SMS using Vonage."""
    try:
        if not VONAGE_API_KEY or not VONAGE_API_SECRET or not VONAGE_PHONE_NUMBER:
            raise ValueError("Vonage credentials not configured.")

        response = vonage_client.sms.send_message({
            'from': VONAGE_PHONE_NUMBER,
            'to': phone_number,
            'text': message,
        })
        if response["messages"][0]["status"] == "0":
            logging.info(f"Vonage SMS sent to {phone_number}, Message ID: {response['messages'][0]['message-id']}")
            return True
        else:
            logging.error(f"Vonage SMS failed to {phone_number}: {response['messages'][0]['error-text']}")
            return False
    except Exception as e:
        logging.error(f"Vonage SMS failed to {phone_number}: {e}")
        return False

def send_sms_aws_sns(phone_number, message):
    """Send SMS using AWS SNS."""
    try:
        if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY or not AWS_REGION_NAME:
            raise ValueError("AWS SNS credentials not configured.")

        response = sns_client.publish(
            PhoneNumber=phone_number,
            Message=message,
            MessageAttributes={
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional'  # or 'Promotional'
                }
            }
        )
        logging.info(f"AWS SNS SMS sent to {phone_number}, Message ID: {response['MessageId']}")
        return True
    except Exception as e:
        logging.error(f"AWS SNS SMS failed to {phone_number}: {e}")
        return False

def send_sms_plivo(phone_number, message):
    """Send SMS using Plivo."""
    try:
        if not PLIVO_AUTH_ID or not PLIVO_AUTH_TOKEN or not PLIVO_PHONE_NUMBER:
            raise ValueError("Plivo credentials not configured.")

        response = plivo_client.messages.create(
            src=PLIVO_PHONE_NUMBER,
            dst=phone_number,
            text=message,
        )
        logging.info(f"Plivo SMS sent to {phone_number}, Message UUID: {response.message_uuid[0]}")
        return True
    except PlivoRestError as e:
        logging.error(f"Plivo SMS failed to {phone_number}: {e}")
        return False

def send_sms_messagebird(phone_number, message):
    """Send SMS using Messagebird."""
    try:
        if not MESSAGEBIRD_API_KEY or not MESSAGEBIRD_PHONE_NUMBER:
            raise ValueError("Messagebird credentials not configured.")

        response = messagebird_client.message_create(
            MESSAGEBIRD_PHONE_NUMBER,
            phone_number,
            message,
        )
        logging.info(f"Messagebird SMS sent to {phone_number}, Message ID: {response.id}")
        return True
    except messagebird.client.ErrorException as e:
        logging.error(f"Messagebird SMS failed to {phone_number}: {e}")
        return False

def send_sms_telnyx(phone_number, message):
    """Send SMS using Telnyx."""
    try:
        if not TELNYX_API_KEY or not TELNYX_PHONE_NUMBER:
            raise ValueError("Telnyx credentials not configured.")

        response = telnyx.Message.create(
            to=phone_number,
            from_=TELNYX_PHONE_NUMBER,
            text=message,
        )
        logging.info(f"Telnyx SMS sent to {phone_number}, Message ID: {response.id}")
        return True
    except telnyx.error.APIError as e:
        logging.error(f"Telnyx SMS failed to {phone_number}: {e}")
        return False

def send_sms_telesign(phone_number, message):
    """Send SMS using Telesign."""
    try:
        if not TELESIGN_CUSTOMER_ID or not TELESIGN_API_KEY or not TELESIGN_PHONE_NUMBER:
            raise ValueError("Telesign credentials not configured.")

        response = telesign_client.message(phone_number, message, "ARN")
        if response.ok:
            logging.info(f"Telesign SMS sent to {phone_number}, Reference ID: {response.json['reference_id']}")
            return True
        else:
            logging.error(f"Telesign SMS failed to {phone_number}: {response.body}")
            return False
    except Exception as e:
        logging.error(f"Telesign SMS failed to {phone_number}: {e}")
        return False

def send_sms_textbelt(phone_number, message):
    """Send SMS using TextBelt."""
    try:
        response = requests.post('https://textbelt.com/text', {
            'phone': phone_number,
            'message': message,
            'key': 'textbelt',  # Use the free tier
        })
        response_json = response.json()
        if response_json.get("success"):
            logging.info(f"TextBelt SMS sent to {phone_number}")
            return True
        else:
            logging.error(f"TextBelt SMS failed to {phone_number}: {response_json.get('error')}")
            return False
    except Exception as e:
        logging.error(f"TextBelt SMS failed to {phone_number}: {e}")
        return False

def sanitize_input(input_string):
    """Sanitize input to prevent script injection."""
    return ''.join(char for char in input_string if char.isalnum() or char in [' ', '.', '-', '+'])

def rate_limit():
    """Implement rate limiting."""
    global last_sent_time
    current_time = time.time()
    time_elapsed = current_time - last_sent_time
    if time_elapsed < rate_limit_seconds:
        time_to_wait = rate_limit_seconds - time_elapsed
        logging.warning(f"Rate limit exceeded. Waiting {time_to_wait:.2f} seconds.")
        time.sleep(time_to_wait)
    last_sent_time = time.time()

@app.route('/send_sms', methods=['POST'])
def send_sms():
    """API endpoint to send SMS."""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        message = data.get('message')
        provider_id = data.get('provider_id')  # Use provider ID instead of name

        if not phone_number or not message or not provider_id:
            return jsonify({'status': 'error', 'message': 'Phone number, message, and provider ID are required.'}), 400

        phone_number = sanitize_input(phone_number)

        rate_limit()

        # Get provider details
        provider = SMS_PROVIDERS.get(provider_id)
        if not provider:
            return jsonify({'status': 'error', 'message': 'Invalid provider ID.'}), 400

        # Check API
        api_check_function = provider.get("api_check")
        if api_check_function:
            api_working, api_message = api_check_function()
            if not api_working:
                return jsonify({'status': 'error', 'message': api_message}), 400

        # Choose provider function
        provider_function = provider.get("function")

        if provider_function:
            if provider_function(phone_number, message):
                return jsonify({'status': 'success', 'provider': provider["name"]})
            else:
                return jsonify({'status': 'error', 'message': f'{provider["name"]} failed.'}), 500
        else:
            return jsonify({'status': 'error', 'message': f'{provider["name"]} is not implemented yet.'}), 500

    except Exception as e:
        logging.exception("Error in /send_sms endpoint")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/list_providers', methods=['GET'])
def list_providers():
    """API endpoint to list available providers."""
    provider_list = [{"id": key, "name": value["name"]} for key, value in SMS_PROVIDERS.items()]
    return jsonify(provider_list)

@app.route('/generate_number', methods=['GET'])
def generate_number():
    """API endpoint to generate a phone number."""
    return jsonify({'phone_number': generate_phone_number()})

@app.route('/check_number', methods=['POST'])
def check_number():
    """API endpoint to check a phone number."""
    data = request.get_json()
    phone_number = data.get('phone_number')
    if not phone_number:
        return jsonify({'status': 'error', 'message': 'Phone number is required.'}), 400
    return jsonify({'status': check_phone_number(phone_number)})

@app.route('/filter_carrier', methods=['POST'])
def filter_carrier_endpoint():
    """API endpoint to filter the carrier of a phone number."""
    data = request.get_json()
    phone_number = data.get('phone_number')
    if not phone_number:
        return jsonify({'status': 'error', 'message': 'Phone number is required.'}), 400
    return jsonify({'carrier': filter_carrier(phone_number)})

@app.route('/check_and_filter', methods=['POST'])
def check_and_filter_endpoint():
    """API endpoint to check and filter a phone number."""
    data = request.get_json()
    phone_number = data.get('phone_number')
    if not phone_number:
        return jsonify({'status': 'error', 'message': 'Phone number is required.'}), 400
    return jsonify(check_and_filter_carrier(phone_number))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
