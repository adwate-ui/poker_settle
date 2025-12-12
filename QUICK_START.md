# Quick Start - Email Integration & Payment Preference

## 🎯 What Changed?

### 1. WhatsApp → Email
Players now receive game reports and payment links via **email** instead of WhatsApp.

### 2. Manual Payment Preference
You can now **manually select** if a player prefers UPI or Cash payments.

---

## ⚡ 5-Minute Setup

### Step 1: Database (2 min)
Open Supabase SQL Editor and run:
```sql
ALTER TABLE public.players RENAME COLUMN phone_number TO email;
CREATE INDEX IF NOT EXISTS idx_players_email ON public.players(email);
```

### Step 2: EmailJS (3 min)
1. Go to https://www.emailjs.com/ → Sign up (free)
2. Add Gmail service → Connect your Gmail
3. Create template → Use this:
   - Subject: `{{subject}}`
   - Body: `{{{html_message}}}`
4. Copy: Service ID, Template ID, Public Key

### Step 3: Environment Variables
In your `.env` file:
```env
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxx
VITE_FROM_EMAIL=your_email@gmail.com
VITE_FROM_NAME=Poker Settle
```

### Step 4: Deploy
```bash
npm install
npm run build
# Deploy
```

**Done!** ✅

---

## 📱 How to Use

### Adding a Player
**Before:** Enter WhatsApp phone number  
**Now:** Enter email address (optional)

**New Feature:** Select payment preference:
- 📱 UPI
- 💵 Cash

### Editing Payment Preference
1. Go to player's page
2. Click "Edit Details"
3. Change payment preference dropdown
4. Save

### Game Completion
**Automatic:**
- Game reports sent to all players with emails
- Settlement notifications with UPI links
- No change in your workflow!

---

## 📧 Email Template (Copy This)

**For EmailJS Template:**

**Name:** poker_settle_notification

**Subject:**
```
{{subject}}
```

**HTML Body:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #1f2937;">{{subject}}</h2>
    <p>Hi {{to_name}}!</p>
    <div style="line-height: 1.8;">{{{html_message}}}</div>
    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px;">
      Best regards,<br>{{from_name}}
    </p>
  </div>
</div>
```

---

## ✅ Verify Setup

### Test Email Notification
1. Create a test player with your email
2. Create a game with test player
3. Complete the game
4. Check your inbox for email

### Test Payment Preference
1. Create player
2. Select "Cash" preference
3. Add UPI ID (optional)
4. Save
5. Check preference stays "Cash" ✓

---

## 🐛 Troubleshooting

**Emails not sending?**
- Check EmailJS credentials in `.env`
- Verify template is active
- Check browser console for errors

**Can't change payment preference?**
- Clear browser cache
- Check database migration ran
- Verify you're on latest version

**Migration error?**
- Check if column already renamed
- Backup database first
- Try manually in SQL editor

---

## 📚 Full Documentation

- **IMPLEMENTATION_SUMMARY_EMAIL.md** - Complete overview
- **EMAIL_SETUP_GUIDE.md** - Detailed EmailJS setup
- **TESTING_CHECKLIST.md** - Full testing guide
- **CHANGES_SUMMARY.md** - Technical details

---

## 💡 Pro Tips

1. **Free Tier**: EmailJS free = 200 emails/month
2. **Gmail Works Best**: Most reliable for free tier
3. **Optional Email**: Players work without email (just no notifications)
4. **Mobile UPI Links**: Test payment links on mobile device
5. **Backup First**: Always backup database before migration

---

## 📞 Need Help?

1. Check browser console for errors
2. Review EMAIL_SETUP_GUIDE.md
3. Use TESTING_CHECKLIST.md
4. Create GitHub issue

---

## 🎉 That's It!

Your poker settlement app now uses email notifications and has manual payment preference selection.

**Questions?** See full documentation files.

**Ready to deploy?** Follow the 5-minute setup above!

---

**Version**: 2.0.0  
**Date**: December 12, 2025  
**Status**: Ready to Deploy ✅
