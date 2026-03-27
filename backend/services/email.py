"""
Email Notification Service for KinetiK

Uses Resend API for sending transactional emails.
Can be easily swapped for SendGrid, AWS SES, or other providers.
"""

import os
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Email configuration
EMAIL_FROM = os.getenv("EMAIL_FROM", "KinetiK <notifications@kinetik.app>")
EMAIL_REPLY_TO = os.getenv("EMAIL_REPLY_TO", "support@kinetik.app")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")

# Feature flag for email service
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "false").lower() == "true"


class EmailService:
    """Handles all email notifications for the platform."""
    
    def __init__(self):
        self.enabled = EMAIL_ENABLED and bool(RESEND_API_KEY)
        if self.enabled:
            try:
                import resend
                resend.api_key = RESEND_API_KEY
                self.resend = resend
                logger.info("Email service initialized with Resend")
            except ImportError:
                logger.warning("Resend not installed. Email service disabled.")
                self.enabled = False
                self.resend = None
        else:
            self.resend = None
            logger.info("Email service disabled (EMAIL_ENABLED=false or no API key)")
    
    def _send_email(
        self,
        to: str,
        subject: str,
        html: str,
        text: Optional[str] = None,
    ) -> bool:
        """Internal method to send an email."""
        if not self.enabled:
            logger.debug(f"Email not sent (disabled): {subject} -> {to}")
            return False
        
        try:
            params = {
                "from": EMAIL_FROM,
                "to": [to],
                "subject": subject,
                "html": html,
                "reply_to": EMAIL_REPLY_TO,
            }
            if text:
                params["text"] = text
            
            self.resend.Emails.send(params)
            logger.info(f"Email sent: {subject} -> {to}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    # =========================================================================
    # Email Templates
    # =========================================================================
    
    def send_welcome_email(self, to: str, name: str) -> bool:
        """Send welcome email after signup."""
        subject = "Welcome to KinetiK! 🎉"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #7C3AED, #EC4899); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }}
                .button {{ display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Welcome to KinetiK!</h1>
                </div>
                <div class="content">
                    <p>Hi {name},</p>
                    <p>Thanks for joining KinetiK! We're excited to have you as part of our community of volunteers and organizers making a difference.</p>
                    <p><strong>Here's what you can do next:</strong></p>
                    <ul>
                        <li>Complete your profile and add your skills</li>
                        <li>Browse available volunteer opportunities</li>
                        <li>Apply to events that match your interests</li>
                    </ul>
                    <a href="https://kinetik.app/dashboard" class="button">Go to Dashboard</a>
                    <p>If you have any questions, just reply to this email!</p>
                    <p>Best,<br>The KinetiK Team</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} KinetiK. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return self._send_email(to, subject, html)
    
    def send_application_received(
        self,
        to: str,
        volunteer_name: str,
        event_title: str,
        event_date: str,
    ) -> bool:
        """Send confirmation when a volunteer applies."""
        subject = f"Application Received: {event_title}"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #7C3AED; color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }}
                .event-card {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .button {{ display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">Application Submitted! ✓</h1>
                </div>
                <div class="content">
                    <p>Hi {volunteer_name},</p>
                    <p>Your application has been received. The organizer will review it and get back to you soon.</p>
                    
                    <div class="event-card">
                        <h3 style="margin-top: 0;">{event_title}</h3>
                        <p style="margin: 0; color: #6b7280;">📅 {event_date}</p>
                    </div>
                    
                    <p>You can track your application status in your dashboard.</p>
                    <a href="https://kinetik.app/applications" class="button">View Applications</a>
                </div>
            </div>
        </body>
        </html>
        """
        return self._send_email(to, subject, html)
    
    def send_application_status_update(
        self,
        to: str,
        volunteer_name: str,
        event_title: str,
        status: str,
        organizer_message: Optional[str] = None,
    ) -> bool:
        """Send notification when application status changes."""
        status_emoji = {
            "accepted": "🎉",
            "rejected": "😔",
            "pending": "⏳",
            "waitlisted": "📋",
        }
        
        status_message = {
            "accepted": "Congratulations! You've been accepted",
            "rejected": "Unfortunately, your application was not accepted this time",
            "waitlisted": "You've been added to the waitlist",
        }
        
        emoji = status_emoji.get(status.lower(), "📬")
        message = status_message.get(status.lower(), f"Your application status is: {status}")
        
        subject = f"{emoji} Application Update: {event_title}"
        
        organizer_note = ""
        if organizer_message:
            organizer_note = f"""
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; color: #1e40af;">Message from the organizer:</p>
                <p style="margin: 8px 0 0 0; color: #334155;">{organizer_message}</p>
            </div>
            """
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: {'#10b981' if status == 'accepted' else '#7C3AED'}; color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }}
                .button {{ display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">{emoji} Application Update</h1>
                </div>
                <div class="content">
                    <p>Hi {volunteer_name},</p>
                    <p>{message} for <strong>{event_title}</strong>.</p>
                    {organizer_note}
                    {'<p>See you at the event! Make sure to add it to your calendar.</p>' if status == 'accepted' else ''}
                    <a href="https://kinetik.app/applications" class="button">View Details</a>
                </div>
            </div>
        </body>
        </html>
        """
        return self._send_email(to, subject, html)
    
    def send_new_application_to_organizer(
        self,
        to: str,
        organizer_name: str,
        volunteer_name: str,
        event_title: str,
        volunteer_skills: List[str],
    ) -> bool:
        """Notify organizer of new volunteer application."""
        skills_html = ", ".join(volunteer_skills[:5]) if volunteer_skills else "Not specified"
        
        subject = f"New Application: {volunteer_name} for {event_title}"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #0284c7; color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }}
                .applicant-card {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .button {{ display: inline-block; background: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; }}
                .skills {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }}
                .skill {{ background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 16px; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">New Application 📬</h1>
                </div>
                <div class="content">
                    <p>Hi {organizer_name},</p>
                    <p>A new volunteer has applied to your event!</p>
                    
                    <div class="applicant-card">
                        <h3 style="margin-top: 0;">{volunteer_name}</h3>
                        <p style="color: #6b7280; margin-bottom: 8px;">Applied for: <strong>{event_title}</strong></p>
                        <p style="color: #6b7280; margin-bottom: 4px;">Skills:</p>
                        <div class="skills">
                            {''.join(f'<span class="skill">{s}</span>' for s in volunteer_skills[:5])}
                        </div>
                    </div>
                    
                    <a href="https://kinetik.app/organizer/events" class="button">Review Application</a>
                </div>
            </div>
        </body>
        </html>
        """
        return self._send_email(to, subject, html)
    
    def send_event_reminder(
        self,
        to: str,
        volunteer_name: str,
        event_title: str,
        event_date: str,
        event_location: str,
        hours_until: int = 24,
    ) -> bool:
        """Send reminder before an event."""
        subject = f"⏰ Reminder: {event_title} is {'tomorrow' if hours_until <= 24 else 'coming up'}!"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }}
                .event-details {{ background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .detail {{ display: flex; align-items: center; margin: 8px 0; }}
                .button {{ display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">Don't Forget! ⏰</h1>
                </div>
                <div class="content">
                    <p>Hi {volunteer_name},</p>
                    <p>This is a friendly reminder about your upcoming volunteer event.</p>
                    
                    <div class="event-details">
                        <h3 style="margin-top: 0;">{event_title}</h3>
                        <div class="detail">
                            <span>📅</span>
                            <span style="margin-left: 8px;">{event_date}</span>
                        </div>
                        <div class="detail">
                            <span>📍</span>
                            <span style="margin-left: 8px;">{event_location}</span>
                        </div>
                    </div>
                    
                    <p><strong>Quick checklist:</strong></p>
                    <ul>
                        <li>Review any event instructions</li>
                        <li>Plan your route to the venue</li>
                        <li>Arrive 10-15 minutes early</li>
                    </ul>
                    
                    <a href="https://kinetik.app/dashboard" class="button">View Event Details</a>
                </div>
            </div>
        </body>
        </html>
        """
        return self._send_email(to, subject, html)
    
    def send_review_request(
        self,
        to: str,
        volunteer_name: str,
        event_title: str,
        organizer_name: str,
    ) -> bool:
        """Ask volunteer to review the event/organizer."""
        subject = f"How was {event_title}? ⭐"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }}
                .stars {{ font-size: 32px; text-align: center; margin: 20px 0; }}
                .button {{ display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">Share Your Experience</h1>
                </div>
                <div class="content">
                    <p>Hi {volunteer_name},</p>
                    <p>Thanks for volunteering at <strong>{event_title}</strong>!</p>
                    <p>We'd love to hear how it went. Your feedback helps {organizer_name} improve and helps other volunteers find great opportunities.</p>
                    
                    <div class="stars">⭐⭐⭐⭐⭐</div>
                    
                    <p style="text-align: center;">
                        <a href="https://kinetik.app/history" class="button">Leave a Review</a>
                    </p>
                    
                    <p style="color: #6b7280; font-size: 14px; text-align: center;">
                        It only takes a minute!
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        return self._send_email(to, subject, html)


# Singleton instance
email_service = EmailService()


# Convenience functions
def send_welcome_email(to: str, name: str) -> bool:
    return email_service.send_welcome_email(to, name)


def send_application_received(to: str, volunteer_name: str, event_title: str, event_date: str) -> bool:
    return email_service.send_application_received(to, volunteer_name, event_title, event_date)


def send_application_status_update(
    to: str,
    volunteer_name: str,
    event_title: str,
    status: str,
    organizer_message: Optional[str] = None,
) -> bool:
    return email_service.send_application_status_update(
        to, volunteer_name, event_title, status, organizer_message
    )


def send_new_application_to_organizer(
    to: str,
    organizer_name: str,
    volunteer_name: str,
    event_title: str,
    volunteer_skills: List[str],
) -> bool:
    return email_service.send_new_application_to_organizer(
        to, organizer_name, volunteer_name, event_title, volunteer_skills
    )


def send_event_reminder(
    to: str,
    volunteer_name: str,
    event_title: str,
    event_date: str,
    event_location: str,
    hours_until: int = 24,
) -> bool:
    return email_service.send_event_reminder(
        to, volunteer_name, event_title, event_date, event_location, hours_until
    )


def send_review_request(
    to: str,
    volunteer_name: str,
    event_title: str,
    organizer_name: str,
) -> bool:
    return email_service.send_review_request(to, volunteer_name, event_title, organizer_name)
