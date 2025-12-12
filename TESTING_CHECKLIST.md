# Testing Checklist for Email Integration & Payment Preference

This checklist helps verify that all changes are working correctly after deployment.

## Pre-Deployment Checklist

### 1. Database Migration
- [ ] Run migration: `supabase/migrations/20251212190000_replace_phone_with_email.sql`
- [ ] Verify column renamed: `SELECT email FROM players LIMIT 1;`
- [ ] Verify index exists: Check `idx_players_email` in database

### 2. Environment Variables
- [ ] Remove old Evolution API variables from `.env`
- [ ] Add EmailJS configuration (see `.env.example`)
- [ ] Set `VITE_EMAILJS_SERVICE_ID`
- [ ] Set `VITE_EMAILJS_TEMPLATE_ID`
- [ ] Set `VITE_EMAILJS_PUBLIC_KEY`
- [ ] Set `VITE_FROM_EMAIL`
- [ ] Set `VITE_FROM_NAME`

### 3. EmailJS Setup
- [ ] Create EmailJS account at https://www.emailjs.com/
- [ ] Add email service (Gmail or other)
- [ ] Create email template (use template from EMAIL_SETUP_GUIDE.md)
- [ ] Test template in EmailJS dashboard
- [ ] Copy Service ID, Template ID, and Public Key to `.env`

### 4. Build & Deploy
- [ ] Run `npm install` (ensure @emailjs/browser is installed)
- [ ] Run `npm run build` (should succeed without errors)
- [ ] Deploy to hosting platform

## Post-Deployment Testing

### 5. Player Management

#### Create New Player (Basic)
- [ ] Navigate to "New Game" page
- [ ] Click "Add Player" → Quick add with just name
- [ ] Player created successfully
- [ ] Default payment preference is "UPI"

#### Create New Player (With Details)
- [ ] Click "Add Player" → "Add with Details"
- [ ] Enter name, email, UPI ID
- [ ] Select payment preference (UPI or Cash)
- [ ] Click "Add Player"
- [ ] Player created successfully
- [ ] Check: Welcome email received (if email provided)

#### Test Email Validation
- [ ] Try invalid email format (e.g., "notanemail")
- [ ] Error message shown: "Invalid email format"
- [ ] Try valid email: Success

#### Test Payment Preference Selection
- [ ] Create player with UPI ID but select "Cash" preference
- [ ] Verify preference saved as "Cash" (not auto-changed to UPI)
- [ ] Create player without UPI ID but select "UPI" preference
- [ ] Verify preference saved as "UPI"

### 6. Edit Existing Player

#### From Player Detail Page
- [ ] Go to Players page → Click a player
- [ ] Click "Edit Details" button
- [ ] Change email address
- [ ] Change payment preference
- [ ] Change UPI ID
- [ ] Save changes
- [ ] Verify all changes saved correctly
- [ ] Check: If email was added for first time, welcome email sent

#### Verify Display
- [ ] Email shown under "Contact & Payment Details"
- [ ] Payment preference shown correctly
- [ ] UPI ID shown if present

### 7. Game Completion & Notifications

#### Create and Complete a Game
- [ ] Create a new game with 3-4 players
- [ ] At least 2 players should have email addresses
- [ ] Add buy-ins for all players
- [ ] Add final stacks for all players
- [ ] Click "Complete Game"
- [ ] Game marked as complete
- [ ] Check: Email notifications sent toast message shows
- [ ] Example: "Game completed! 2 email notifications sent."

#### Check Game Completion Emails
- [ ] Check inbox of player with email
- [ ] Email received with subject: "Poker Game Completed - [Date] [🎉 or 📉]"
- [ ] Email contains:
  - [ ] Player name
  - [ ] Game date
  - [ ] Buy-in amount
  - [ ] Final stack
  - [ ] Net profit/loss
  - [ ] Link to game details
- [ ] Click link → Opens correct game page

#### Check Settlement Emails
- [ ] Players with settlements should receive settlement emails
- [ ] Subject: "Settlement Details - Poker Game [💰 or 💳]"
- [ ] Winners receive:
  - [ ] List of who owes them
  - [ ] Amounts
  - [ ] Their UPI ID (if they have one)
- [ ] Payers receive:
  - [ ] List of who they need to pay
  - [ ] Amounts
  - [ ] UPI payment links (if recipient has UPI ID)
  - [ ] Clickable UPI links

#### Test UPI Payment Links
- [ ] On mobile device, click UPI payment link in email
- [ ] UPI app should open (GPay, PhonePe, etc.)
- [ ] Payment details pre-filled:
  - [ ] Recipient UPI ID
  - [ ] Amount
  - [ ] Note ("Poker settlement")

### 8. Payment Preference Independence

#### Test UPI ID Without UPI Preference
- [ ] Create/edit player with UPI ID
- [ ] Set preference to "Cash"
- [ ] Save
- [ ] Verify preference stays "Cash" (not auto-changed to UPI)
- [ ] In settlement calculations, player treated as cash player

#### Test No UPI ID With UPI Preference
- [ ] Create/edit player without UPI ID
- [ ] Set preference to "UPI"
- [ ] Save
- [ ] Verify preference stays "UPI"
- [ ] In settlements, player treated as UPI player

### 9. Edge Cases

#### Player Without Email
- [ ] Create player without email address
- [ ] Complete a game with this player
- [ ] Player appears in game but no email sent
- [ ] No errors in console
- [ ] Other players with email still receive emails

#### Email Service Not Configured
- [ ] Remove EmailJS environment variables
- [ ] Rebuild and deploy
- [ ] Try to complete a game
- [ ] Game completes successfully
- [ ] Toast shows: "Email service not configured"
- [ ] No errors in console

#### Email Send Failure
- [ ] Use invalid EmailJS credentials
- [ ] Complete a game
- [ ] Game completes successfully
- [ ] Toast shows failure count
- [ ] Check browser console for error details

### 10. Settlement Confirmation

#### Manual Confirmation
- [ ] Go to completed game detail view
- [ ] Find "Settlement Confirmations" section
- [ ] Click "Confirm" button on a pending settlement
- [ ] Settlement marked as confirmed (✅ badge)
- [ ] Timestamp shown

#### Confirmed vs Pending Display
- [ ] Confirmed settlements show ✅ Paid badge
- [ ] Pending settlements show ⏳ Pending badge
- [ ] Timestamp shown for confirmed settlements

### 11. Browser Console Check

Throughout testing:
- [ ] No JavaScript errors in browser console
- [ ] No TypeScript errors
- [ ] EmailJS debug messages show success (when configured)
- [ ] Network tab shows email API calls to EmailJS

### 12. Mobile Responsiveness

#### Mobile UI
- [ ] Player form renders correctly on mobile
- [ ] Email input works on mobile keyboard
- [ ] Payment preference dropdown works on mobile
- [ ] Email notifications received on mobile
- [ ] UPI links open apps correctly on mobile

### 13. Performance

#### Email Sending
- [ ] 5 players with email = ~10-15 seconds to send all
- [ ] No UI freeze during email sending
- [ ] Game completes even if some emails fail

### 14. Data Consistency

#### Database Check
Run these queries to verify data:

```sql
-- Check players have email (not phone_number)
SELECT id, name, email, upi_id, payment_preference FROM players LIMIT 5;

-- Check payment preferences are set
SELECT payment_preference, COUNT(*) FROM players GROUP BY payment_preference;

-- Verify no phone_number column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'players' AND column_name = 'phone_number';
-- Should return 0 rows

-- Verify email column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'players' AND column_name = 'email';
-- Should return 1 row
```

## Troubleshooting

### Emails Not Sending
1. Check browser console for errors
2. Verify EmailJS credentials in `.env`
3. Check EmailJS dashboard for quota limits
4. Test template in EmailJS dashboard
5. Try sending a test email manually

### Payment Preference Not Saving
1. Check browser console for errors
2. Verify database migration ran successfully
3. Check player record in database directly
4. Clear browser cache and reload

### Migration Issues
1. Verify you're connected to correct database
2. Check if column already renamed
3. Check for existing data in phone_number field
4. Backup data before running migration

## Success Criteria

All tests pass when:
- ✅ Players can be created with email (not phone)
- ✅ Payment preference can be manually selected
- ✅ Payment preference is independent of UPI ID
- ✅ Email notifications sent on game completion
- ✅ Settlement emails include UPI payment links
- ✅ UPI links open payment apps correctly
- ✅ UI shows "Email Address" instead of "WhatsApp Number"
- ✅ No console errors
- ✅ Build completes successfully
- ✅ Mobile experience works well

## Sign-Off

Tested by: ___________________  
Date: ___________________  
Environment: [ ] Dev [ ] Staging [ ] Production  
Status: [ ] All Pass [ ] Issues Found (see notes)  

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
