import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
from_number = os.getenv("TWILIO_FROM_NUMBER")

# Replace this with the phone number you are trying to text
to_number = "+919725259773"

print("Connecting to Twilio...")
try:
    client = Client(account_sid, auth_token)
    message = client.messages.create(
        body="Test message from LifeOS SOS!",
        from_=from_number,
        to=to_number
    )
    print(f"SUCCESS! Message sent with SID: {message.sid}")
except Exception as e:
    print(f"\nERROR SENDING SMS:\n{str(e)}")
