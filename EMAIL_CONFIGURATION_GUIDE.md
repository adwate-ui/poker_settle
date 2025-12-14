# Email Configuration Guide

This guide will help you set up email notifications for Poker Settle using EmailJS.

## Overview

Poker Settle uses EmailJS to send email notifications to players about:
- Game invitations
- Settlement notifications with payment links
- Payment confirmations
- Game results and statistics

## Prerequisites

- A Gmail account (or other email provider supported by EmailJS)
- Access to the Poker Settle Profile settings

## Step-by-Step Setup

### Step 1: Create an EmailJS Account

1. Go to [emailjs.com](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address
4. Log in to your EmailJS dashboard

**Note:** The free tier includes 100 emails per month, which is usually sufficient for most home poker games.

### Step 2: Add an Email Service

1. In the EmailJS dashboard, navigate to **Email Services**
2. Click **"Add New Service"**
3. Choose your email provider:
   - **Gmail** (recommended for personal use)
   - **Outlook**
   - **Yahoo Mail**
   - Or any other supported provider

#### For Gmail:
1. Select "Gmail" from the list
2. Click **"Connect Account"**
3. Sign in with your Google account
4. Grant EmailJS permission to send emails on your behalf
5. Give your service a name (e.g., "Poker Settle Notifications")
6. Copy the **Service ID** (format: `service_xxxxxxxx`)
   - Keep this safe, you'll need it later

### Step 3: Create an Email Template

1. In the EmailJS dashboard, navigate to **Email Templates**
2. Click **"Create New Template"**
3. Give your template a name (e.g., "Poker Settle Notification")

#### Template Settings (IMPORTANT):

In the **Settings** tab:

1. **From Name**: Leave as default or set to `{{from_name}}`
2. **To Email**: Set to `{{to_email}}` (this is crucial!)
3. **Subject**: Set to `{{subject}}`
4. **Reply To**: Set to `pokersettleapp@gmail.com` (for payment confirmation webhook)

⚠️ **Critical**: The "To Email" field in Settings must be set to `{{to_email}}` (not just in the HTML content). This is a common mistake that causes emails to fail.

#### Template Content:

In the **Content** tab, use this template:

```
Subject: {{subject}}

Hi {{to_name}},

{{message}}

---
Best regards,
{{from_name}}

---
This is an automated message from Poker Settle.
Reply to this email if you have any questions.
```

For HTML content, you can use:

```html
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
    <h2 style="color: #333;">{{subject}}</h2>
    <p>Hi {{to_name}},</p>
    <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 4px;">
      {{message}}
    </div>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #666; font-size: 14px;">
      Best regards,<br>
      {{from_name}}
    </p>
    <p style="color: #999; font-size: 12px; margin-top: 20px;">
      This is an automated message from Poker Settle.<br>
      Reply to this email if you have any questions.
    </p>
  </div>
</body>
</html>
```

4. Click **"Save"**
5. Copy the **Template ID** (format: `template_xxxxxxxx`)

### Step 4: Get Your Public Key

1. In the EmailJS dashboard, go to **Account**
2. Find the **API Keys** section
3. Copy your **Public Key** (format: 20 characters, alphanumeric)
   - This key is safe to use in client-side code

### Step 5: Configure Poker Settle

1. Log in to Poker Settle
2. Go to your **Profile** (click your avatar in the top right)
3. Navigate to the **Email** tab
4. Fill in the configuration fields:
   - **Service ID**: Paste the Service ID from Step 2
   - **Template ID**: Paste the Template ID from Step 3
   - **Public Key**: Paste the Public Key from Step 4
   - **From Email Address**: Enter your email (e.g., `your-email@gmail.com`)
   - **From Name**: Enter a display name (e.g., `Poker Settle` or your name)

5. Click **"Save Configuration"**

### Step 6: Test Your Configuration

1. After saving your configuration, the system will show a success message
2. To test, create a game and try sending a settlement notification
3. Check that the email is received by the test recipient
4. Verify that payment links (UPI) are clickable on mobile devices

## Troubleshooting

### Emails not being sent

**Issue**: Configuration saved but emails aren't being sent

**Solutions**:
1. Check the browser console for error messages
2. Verify all four fields are filled correctly
3. Make sure the Service ID, Template ID, and Public Key don't have extra spaces
4. Confirm your EmailJS account is verified

### "Recipients address is empty" error

**Issue**: EmailJS returns an error about empty recipient address

**Solution**: 
- In your EmailJS template Settings, make sure "To Email" is set to `{{to_email}}`
- This must be in the Settings tab, not just the HTML content

### UPI links not clickable on mobile

**Issue**: Payment links don't work on mobile email clients

**Solution**: 
- This should work automatically with our template
- Make sure the reply-to is set to `pokersettleapp@gmail.com`
- The email content formats UPI links specially for mobile compatibility

### Rate limiting / emails not sending

**Issue**: Hitting EmailJS free tier limits (100 emails/month)

**Solutions**:
1. Upgrade to a paid EmailJS plan (starts at $7/month for 1000 emails)
2. Use a different email service for additional accounts
3. Send settlement notifications selectively (only to players who owe money)

## Security Notes

- Your Public Key is safe to use in client-side code
- Never share your EmailJS account password
- The Service ID and Template ID are not sensitive
- Your email address is visible to recipients (as the sender)

## Payment Confirmation Webhook

For automatic payment confirmations when players reply with keywords like "PAID" or "DONE":

1. All emails are configured with `reply-to: pokersettleapp@gmail.com`
2. Set up a Zapier webhook to forward these emails to your Supabase function
3. See `PAYMENT_CONFIRMATION_WEBHOOK.md` for detailed webhook setup instructions

## Advanced Configuration

### Using Multiple Email Addresses

Each user account in Poker Settle can have its own email configuration. This means:
- Different game organizers can use different email addresses
- You can have separate professional and personal configurations
- Each configuration is private to your account

### Custom Email Templates

You can create multiple templates in EmailJS for different purposes:
- Game invitations
- Settlement notifications
- Thank you messages
- Tournament announcements

Just use different Template IDs in your Poker Settle configuration for different notification types.

## Support

If you encounter issues:
1. Check the EmailJS dashboard for sending logs
2. Review the browser console for error messages
3. Verify all template settings match this guide
4. Test with a simple email first (no special formatting)

For more help:
- EmailJS Documentation: https://www.emailjs.com/docs/
- Poker Settle Issues: https://github.com/adwate-ui/poker_settle/issues
