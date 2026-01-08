import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, Content, To

# Load from .env
from dotenv import load_dotenv
load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")

print(f"API Key: {SENDGRID_API_KEY[:20]}..." if SENDGRID_API_KEY else "NO KEY")
print(f"Sender Email: {SENDER_EMAIL}")

if SENDGRID_API_KEY and SENDER_EMAIL:
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        message = Mail(
            from_email=Email(SENDER_EMAIL, "M-Dental Test"),
            to_emails=To("lulzimn995@gmail.com"),
            subject="Test Email from M-Dental",
            html_content=Content("text/html", "<p>This is a test email</p>")
        )
        response = sg.send(message)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.headers}")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {str(e)}")
else:
    print("Missing API key or sender email")
