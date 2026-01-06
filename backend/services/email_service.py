"""
Email Service - Send transactional emails
Uses SMTP or SendGrid for production
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from datetime import datetime

class EmailService:
    """
    Handles all email sending operations
    Supports both SMTP and SendGrid (via API)
    """
    
    def __init__(self):
        # Email configuration from environment variables
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@smartmenu.co.nz')
        self.from_name = os.getenv('FROM_NAME', 'Smart Menu')
        
        # SendGrid API key (optional, preferred for production)
        self.sendgrid_api_key = os.getenv('SENDGRID_API_KEY', '')
        self.use_sendgrid = bool(self.sendgrid_api_key)
        
        # For development - log emails instead of sending
        self.dev_mode = os.getenv('EMAIL_DEV_MODE', 'true').lower() == 'true'
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email body
            text_content: Plain text email body (fallback)
            
        Returns:
            True if email sent successfully
        """
        if self.dev_mode:
            print(f"\n{'='*60}")
            print(f"📧 EMAIL (DEV MODE - Not Actually Sent)")
            print(f"{'='*60}")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"Content Preview:\n{text_content or html_content[:200]}...")
            print(f"{'='*60}\n")
            return True
        
        try:
            if self.use_sendgrid:
                return self._send_via_sendgrid(to_email, subject, html_content, text_content)
            else:
                return self._send_via_smtp(to_email, subject, html_content, text_content)
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False
    
    def _send_via_smtp(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str]
    ) -> bool:
        """Send email via SMTP"""
        if not self.smtp_user or not self.smtp_password:
            print("⚠️ SMTP credentials not configured")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Add plain text and HTML parts
            if text_content:
                msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))
            
            # Send via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            print(f"✅ Email sent to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ SMTP error: {str(e)}")
            return False
    
    def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str]
    ) -> bool:
        """Send email via SendGrid API"""
        try:
            import requests
            
            url = "https://api.sendgrid.com/v3/mail/send"
            headers = {
                "Authorization": f"Bearer {self.sendgrid_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "personalizations": [{
                    "to": [{"email": to_email}],
                    "subject": subject
                }],
                "from": {
                    "email": self.from_email,
                    "name": self.from_name
                },
                "content": [
                    {"type": "text/plain", "value": text_content or html_content},
                    {"type": "text/html", "value": html_content}
                ]
            }
            
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 202:
                print(f"✅ Email sent to {to_email} via SendGrid")
                return True
            else:
                print(f"❌ SendGrid error: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ SendGrid error: {str(e)}")
            return False
    
    # ============================================================
    # Email Templates
    # ============================================================
    
    def send_order_confirmation(
        self,
        to_email: str,
        order: Dict[str, Any],
        restaurant_name: str
    ) -> bool:
        """
        Send order confirmation email to customer
        
        Args:
            to_email: Customer email
            order: Order details dictionary
            restaurant_name: Restaurant name
        """
        order_id = order.get('id', 'N/A')
        order_id_short = order_id[:8] if order_id != 'N/A' else 'N/A'
        total = order.get('total_price', 0)
        service_type = order.get('service_type', 'dine_in')
        
        subject = f"Order Confirmation - {restaurant_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Thank you for your order at <strong>{restaurant_name}</strong>!
                </p>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px;">
                        <strong>Order ID:</strong> #{order_id_short}
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">
                        <strong>Service Type:</strong> {service_type.replace('_', ' ').title()}
                    </p>
                </div>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">Order Total</h3>
                    <p style="font-size: 32px; font-weight: bold; color: #f97316; margin: 10px 0;">
                        ${total:.2f} NZD
                    </p>
                </div>
                
                <div style="margin: 30px 0; padding: 20px; background: #ecfdf5; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #065f46;">What's Next?</h3>
                    <p style="margin: 5px 0;">✅ Your order is being prepared</p>
                    <p style="margin: 5px 0;">⏱️ Estimated time: ~15 minutes</p>
                    <p style="margin: 5px 0;">📱 Track your order status anytime</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/order-status/{order_id}" 
                       style="display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Track Your Order
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
                    Questions? Contact {restaurant_name} directly.<br>
                    This is an automated email, please do not reply.
                </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                <p style="margin: 5px 0;">Powered by Smart Menu</p>
                <p style="margin: 5px 0;">© {datetime.now().year} Smart Menu. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
Order Confirmation - {restaurant_name}

Thank you for your order!

Order ID: #{order_id_short}
Service Type: {service_type.replace('_', ' ').title()}
Total: ${total:.2f} NZD

Your order is being prepared.
Estimated time: ~15 minutes

Track your order: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/order-status/{order_id}

---
Powered by Smart Menu
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_trial_expiration_reminder(
        self,
        to_email: str,
        days_remaining: int,
        user_name: Optional[str] = None
    ) -> bool:
        """
        Send trial expiration reminder
        
        Args:
            to_email: User email
            days_remaining: Days left in trial
            user_name: User's name (optional)
        """
        greeting = f"Hi {user_name}" if user_name else "Hi there"
        
        subject = f"⏰ Your Smart Menu trial expires in {days_remaining} days"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Trial Ending Soon</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                    {greeting},
                </p>
                
                <p style="font-size: 16px;">
                    Your <strong>14-day free trial</strong> of Smart Menu will expire in <strong>{days_remaining} days</strong>.
                </p>
                
                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #991b1b;">Don't Lose Access!</h3>
                    <p style="margin: 0; font-size: 14px; color: #7f1d1d;">
                        After your trial ends, you'll lose access to:
                    </p>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #7f1d1d;">
                        <li>AI Image Generation</li>
                        <li>AI Image Enhancement</li>
                        <li>Menu Management</li>
                        <li>Order System</li>
                    </ul>
                </div>
                
                <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #065f46;">Choose Your Plan</h3>
                    
                    <div style="margin: 15px 0;">
                        <strong style="color: #1f2937;">Starter</strong> - $39/month
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">
                            30 menu items, 30 AI generations
                        </p>
                    </div>
                    
                    <div style="margin: 15px 0; padding: 15px; background: #fef3c7; border-radius: 6px;">
                        <strong style="color: #92400e;">⭐ Professional</strong> - $89/month
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #78350f;">
                            <strong>Most Popular!</strong> Unlimited menus, 200 AI generations
                        </p>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <strong style="color: #1f2937;">Enterprise</strong> - $199/month
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">
                            Unlimited menus, 500 AI generations, White label
                        </p>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/pricing" 
                       style="display: inline-block; background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                        Upgrade Now
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; text-align: center;">
                    Questions? Reply to this email or contact support.
                </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                <p style="margin: 5px 0;">Smart Menu - Digital Menu & Ordering System</p>
                <p style="margin: 5px 0;">© {datetime.now().year} Smart Menu. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
{greeting},

Your 14-day free trial of Smart Menu will expire in {days_remaining} days.

Don't lose access to:
- AI Image Generation
- AI Image Enhancement
- Menu Management
- Order System

Choose Your Plan:
- Starter: $39/month (30 menus, 30 AI gen)
- Professional: $89/month (Unlimited menus, 200 AI gen) ⭐ Most Popular
- Enterprise: $199/month (Unlimited, 500 AI gen, White label)

Upgrade now: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/pricing

---
Smart Menu
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_welcome_email(
        self,
        to_email: str,
        user_name: Optional[str] = None
    ) -> bool:
        """Send welcome email to new users"""
        greeting = f"Hi {user_name}" if user_name else "Welcome"
        
        subject = "🎉 Welcome to Smart Menu - Your 14-Day Trial Starts Now!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome to Smart Menu!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">
                    {greeting}! 👋
                </p>
                
                <p style="font-size: 16px;">
                    Thank you for signing up! Your <strong>14-day free trial</strong> has started.
                </p>
                
                <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #065f46;">What's Included in Your Trial:</h3>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #065f46;">
                        <li>✅ 20 menu items</li>
                        <li>✅ 5 AI image generations</li>
                        <li>✅ 5 AI image enhancements</li>
                        <li>✅ Multi-language support</li>
                        <li>✅ QR code menu</li>
                        <li>✅ Order management system</li>
                    </ul>
                </div>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #1f2937;">Quick Start Guide:</h3>
                    <ol style="margin: 0; padding-left: 20px;">
                        <li style="margin: 10px 0;">Create your restaurant profile</li>
                        <li style="margin: 10px 0;">Upload your menu items</li>
                        <li style="margin: 10px 0;">Use AI to generate/enhance photos</li>
                        <li style="margin: 10px 0;">Generate your QR code</li>
                        <li style="margin: 10px 0;">Start taking orders!</li>
                    </ol>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard" 
                       style="display: inline-block; background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                        Go to Dashboard
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #6b7280;">
                    Need help? Check out our <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/docs" style="color: #f97316;">documentation</a> or reply to this email.
                </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                <p style="margin: 5px 0;">Smart Menu - Digital Menu & Ordering System</p>
                <p style="margin: 5px 0;">© {datetime.now().year} Smart Menu. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
{greeting}! 👋

Thank you for signing up for Smart Menu! Your 14-day free trial has started.

What's Included in Your Trial:
✅ 20 menu items
✅ 5 AI image generations
✅ 5 AI image enhancements
✅ Multi-language support
✅ QR code menu
✅ Order management system

Quick Start:
1. Create your restaurant profile
2. Upload your menu items
3. Use AI to generate/enhance photos
4. Generate your QR code
5. Start taking orders!

Get started: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard

Need help? Reply to this email.

---
Smart Menu
        """
        
        return self.send_email(to_email, subject, html_content, text_content)


# Create singleton instance
email_service = EmailService()

