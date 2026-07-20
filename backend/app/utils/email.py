"""
LifeOS Backend — Email Service
Utility to send secure emails via SMTP (e.g., Gmail).
"""

import smtplib
import logging
from email.message import EmailMessage
from app.config import get_settings

logger = logging.getLogger("lifeos.email")


def send_verification_email(recipient_email: str, code: str) -> bool:
    """
    Sends a verification code email to the specified recipient.
    Returns True if successful, False otherwise.
    """
    settings = get_settings()
    
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD or settings.SMTP_PASSWORD == "PASTE_16_CHAR_APP_PASSWORD_HERE":
        logger.error("Email service is not configured! Check SMTP_EMAIL and SMTP_PASSWORD in .env")
        return False
        
    try:
        msg = EmailMessage()
        msg.set_content(
            f"Hello,\n\n"
            f"You requested to reset your password for LifeOS.\n\n"
            f"Your verification code is: {code}\n\n"
            f"This code will expire in 15 minutes.\n\n"
            f"If you did not request this, please ignore this email."
        )
        msg["Subject"] = "LifeOS - Your Password Reset Code"
        msg["From"] = f"LifeOS <{settings.SMTP_EMAIL}>"
        msg["To"] = recipient_email
        
        # Connect to Gmail SMTP server
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Verification email successfully sent to {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False

def send_login_alert_email(recipient_email: str, ip_address: str, user_agent: str, time_str: str) -> bool:
    """
    Sends an email alerting the user of a new login to their account.
    """
    settings = get_settings()
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD or settings.SMTP_PASSWORD == "PASTE_16_CHAR_APP_PASSWORD_HERE":
        return False
        
    try:
        msg = EmailMessage()
        
        # Fallback Plain Text
        msg.set_content(
            f"Hello,\n\n"
            f"We noticed a new login to your LifeOS account.\n\n"
            f"Time: {time_str}\n"
            f"IP Address: {ip_address}\n"
            f"Device/Browser: {user_agent}\n\n"
            f"If this was you, you can safely ignore this email.\n"
            f"If you do not recognize this login, please change your password immediately."
        )
        
        # Aesthetic HTML Template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #2563eb, #06b6d4); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">New Login Alert</h1>
            </div>
            <div style="padding: 40px 32px;">
              <p style="font-size: 16px; color: #475569; margin-top: 0;">We noticed a new login to your LifeOS account.</p>
              
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;"><strong>Time:</strong> {time_str}</p>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;"><strong>IP Address:</strong> {ip_address}</p>
                <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Device:</strong> {user_agent}</p>
              </div>

              <p style="font-size: 15px; color: #475569;">If this was you, you can safely ignore this email.</p>
              <p style="font-size: 15px; color: #dc2626; font-weight: 600;">If you do not recognize this activity, please change your password immediately and review your account security settings.</p>
            </div>
          </div>
        </body>
        </html>
        """
        msg.add_alternative(html_content, subtype='html')
        
        msg["Subject"] = "LifeOS - New Login Detected"
        msg["From"] = f"LifeOS Security <{settings.SMTP_EMAIL}>"
        msg["To"] = recipient_email
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Login alert email sent to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send login alert to {recipient_email}: {str(e)}")
        return False

def send_sos_email(recipient_emails: list[str], user_name: str, location_url: str | None = None) -> bool:
    """
    Sends an SOS emergency email to the provided list of contact emails.
    """
    settings = get_settings()
    
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD or settings.SMTP_PASSWORD == "PASTE_16_CHAR_APP_PASSWORD_HERE":
        logger.error("Email service is not configured! Check SMTP_EMAIL and SMTP_PASSWORD in .env")
        return False
        
    if not recipient_emails:
        return True
        
    try:
        msg = EmailMessage()
        
        # Fallback Plain Text
        text_content = (
            f"🚨 EMERGENCY ALERT 🚨\n\n"
            f"{user_name} has triggered an SOS emergency alert via LifeOS.\n\n"
            f"They may be in immediate danger or in need of urgent medical assistance.\n"
        )
        if location_url:
            text_content += f"\n📍 LIVE LOCATION:\n{location_url}\n\n"
        text_content += (
            f"Please attempt to contact them immediately.\n\n"
            f"This is an automated emergency message."
        )
        msg.set_content(text_content)
        
        # Aesthetic HTML Template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(220, 38, 38, 0.15); border: 2px solid #ef4444;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 32px 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🚨</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Emergency SOS Alert</h1>
            </div>

            <!-- Body -->
            <div style="padding: 40px 32px;">
              <p style="font-size: 18px; color: #1e293b; line-height: 1.6; margin-top: 0; font-weight: 600;">
                URGENT NOTIFICATION
              </p>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <p style="margin: 0; font-size: 18px; color: #7f1d1d;">
                  <strong style="font-size: 20px;">{user_name}</strong> has triggered an SOS emergency alert via LifeOS.
                </p>
              </div>

              <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
                They may be in immediate danger or in need of urgent medical assistance. 
                Please attempt to contact them immediately.
              </p>

              {f'''
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155; font-weight: 600;">📍 Live Location Shared</p>
                <a href="{location_url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">View on Google Maps</a>
              </div>
              ''' if location_url else ''}

              <div style="text-align: center; margin-top: 32px;">
                <a href="{location_url if location_url else '#'}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Take Action Now</a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 13px; color: #64748b;">
                This is an automated emergency message sent securely via the LifeOS Emergency System.
              </p>
            </div>

          </div>
        </body>
        </html>
        """
        
        msg.add_alternative(html_content, subtype='html')
        
        msg["Subject"] = f"URGENT: Emergency SOS Alert from {user_name}"
        msg["From"] = f"LifeOS Emergency System <{settings.SMTP_EMAIL}>"
        msg["To"] = ", ".join(recipient_emails)
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"SOS email successfully sent to {len(recipient_emails)} contacts")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send SOS email: {str(e)}")
        return False

def send_sos_sms_twilio(phone_numbers: list[str], user_name: str, location_url: str | None = None) -> bool:
    """
    Sends an SOS SMS via Twilio.
    """
    settings = get_settings()
    
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_FROM_NUMBER:
        logger.error("Twilio is not configured! Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in .env")
        return False
        
    if not phone_numbers:
        return True
        
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        text = f"🚨SOS: {user_name} needs urgent help."
        if location_url:
            text += f" Loc: {location_url}"
            
        success_count = 0
        for number in phone_numbers:
            try:
                # Ensure the number has a '+' prefix if it's purely digits (usually a good practice for Twilio)
                formatted_number = number if number.startswith('+') else f"+{number}"
                
                message = client.messages.create(
                    body=text,
                    from_=settings.TWILIO_FROM_NUMBER,
                    to=formatted_number
                )
                logger.info(f"SOS SMS sent to {formatted_number} (SID: {message.sid})")
                success_count += 1
            except Exception as inner_e:
                logger.error(f"Failed to send SOS SMS to {number}: {str(inner_e)}")
                
        return success_count > 0
    except Exception as e:
        logger.error(f"Failed to connect to Twilio: {str(e)}")
        return False
