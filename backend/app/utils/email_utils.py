import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

SMTP_EMAIL = os.getenv("SMTP_EMAIL")      # your Gmail address
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") # your 16-char app password

def send_assignment_email(
    volunteer_email: str,
    volunteer_name: str,
    donation_name: str,
    pickup_location: str,
    quantity: str,
):
    """
    Sends an email to the volunteer when an NGO assigns them a donation task.
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("⚠️  SMTP credentials not set. Skipping email.")
        return

    subject = "📦 New Task Assigned to You — FoodRescue"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                border: 1px solid #c8e6d4; border-radius: 12px; overflow: hidden;">

      <!-- Header -->
      <div style="background-color: #2d6a4f; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">🥗 FoodRescue</h1>
        <p style="color: #d8f3dc; margin: 6px 0 0;">Save food. Serve people.</p>
      </div>

      <!-- Body -->
      <div style="padding: 28px; background-color: #f6faf7;">
        <p style="font-size: 16px; color: #1b2d25;">Hi <strong>{volunteer_name}</strong>,</p>
        <p style="color: #4a6560;">
          An NGO has assigned you a new food donation task. Please log in to the app to view and accept it.
        </p>

        <!-- Task Card -->
        <div style="background: #ffffff; border-radius: 10px;
                    border: 1px solid #c8e6d4; padding: 18px; margin: 20px 0;">
          <h3 style="color: #2d6a4f; margin: 0 0 14px;">📋 Task Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #95b5a8; font-size: 13px; padding: 6px 0;
                         font-weight: 600; width: 40%;">FOOD ITEM</td>
              <td style="color: #1b2d25; font-size: 14px; font-weight: 600;">
                {donation_name or "N/A"}
              </td>
            </tr>
            <tr>
              <td style="color: #95b5a8; font-size: 13px; padding: 6px 0; font-weight: 600;">PICKUP LOCATION</td>
              <td style="color: #1b2d25; font-size: 14px; font-weight: 600;">
                {pickup_location or "N/A"}
              </td>
            </tr>
            <tr>
              <td style="color: #95b5a8; font-size: 13px; padding: 6px 0; font-weight: 600;">QUANTITY</td>
              <td style="color: #1b2d25; font-size: 14px; font-weight: 600;">
                {quantity or "N/A"}
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 24px 0;">
          <span style="background-color: #2d6a4f; color: #ffffff;
                       padding: 12px 32px; border-radius: 30px;
                       font-weight: bold; font-size: 15px; display: inline-block;">
            Open the FoodRescue App to View Task
          </span>
        </div>

        <p style="color: #95b5a8; font-size: 12px; text-align: center;">
          You're receiving this because an NGO assigned a task to your account.<br/>
          — The FoodRescue Team
        </p>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = SMTP_EMAIL
    msg["To"]      = volunteer_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, volunteer_email, msg.as_string())
        print(f"✅ Assignment email sent to {volunteer_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        # We don't raise — email failure should NOT break the assignment API