# Email Verification Troubleshooting Guide

**Date:** 2025-11-17
**Issue:** Verification emails not sending in production

---

## 🚨 **Problem**

Users signing up on the live site:
- ❌ Don't receive verification email
- ❌ "Resend" button fails with error

**Root Cause:** Supabase email configuration not set up properly in production

---

## ✅ **Quick Fix Checklist**

### **1. Enable Email Confirmations**

**Supabase Dashboard → Authentication → Settings → Auth Providers**

- [ ] "Email" provider is ENABLED
- [ ] "Confirm email" is turned ON
- [ ] "Secure email change" is ON (recommended)

### **2. Configure SMTP Settings** ⭐ **MOST IMPORTANT**

**Supabase Dashboard → Project Settings → Auth → SMTP Settings**

**Problem:** Supabase's default SMTP is very limited and unreliable

**Solution:** Use custom SMTP (required for production)

---

## 🔧 **SMTP Configuration Options**

### **Option A: Gmail (Quick Setup)**

**Pros:** Free, easy to set up
**Cons:** Daily limits, can be flagged as spam
**Best for:** Testing, small projects

**Setup:**

1. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Sign in to your Google account
   - Click "Create" or "Generate"
   - Select "Other (Custom name)"
   - Name it: "Lil Widget Supabase"
   - Copy the 16-character password (no spaces)

2. **Configure in Supabase:**
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP Username: your-email@gmail.com
   SMTP Password: [16-char app password from step 1]
   Sender Email: your-email@gmail.com
   Sender Name: Lil Widget
   ```

3. **Test:** Try resending verification email

---

### **Option B: SendGrid (Recommended for Production)** ⭐

**Pros:** 100 emails/day free, reliable, professional
**Cons:** Requires signup
**Best for:** Production sites

**Setup:**

1. **Create SendGrid Account:**
   - Go to: https://signup.sendgrid.com/
   - Sign up for free account
   - Verify your email

2. **Create API Key:**
   - Dashboard → Settings → API Keys
   - Click "Create API Key"
   - Name: "Lil Widget"
   - Permissions: "Full Access" (or "Mail Send" only)
   - Copy the API key (starts with "SG.")

3. **Verify Sender Email:**
   - Dashboard → Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Fill in your details (use business email)
   - Check email and click verification link

4. **Configure in Supabase:**
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP Username: apikey
   SMTP Password: [Your SendGrid API key from step 2]
   Sender Email: [Your verified sender email]
   Sender Name: Lil Widget
   ```

---

### **Option C: Mailgun (Also Good)**

**Pros:** 5,000 emails/month free, very reliable
**Cons:** Credit card required (even for free tier)
**Best for:** Growing businesses

**Setup:**

1. Sign up: https://signup.mailgun.com/
2. Verify domain or use their sandbox domain
3. Get SMTP credentials from Dashboard → Sending → Domain Settings
4. Configure in Supabase:
   ```
   SMTP Host: smtp.mailgun.org
   SMTP Port: 587
   SMTP Username: [From Mailgun]
   SMTP Password: [From Mailgun]
   Sender Email: [Your verified email]
   Sender Name: Lil Widget
   ```

---

### **Option D: Amazon SES (Advanced)**

**Pros:** Cheapest at scale ($0.10 per 1,000 emails)
**Cons:** More complex setup, requires AWS account
**Best for:** High-volume production apps

---

## 🌐 **3. Configure Site URLs**

**Supabase Dashboard → Authentication → URL Configuration**

- [ ] **Site URL:** `https://lilwidget.com` (your production domain)
- [ ] **Redirect URLs:**
  - Add: `https://lilwidget.com/**`
  - Add: `https://www.lilwidget.com/**` (if you use www)
  - For localhost testing: `http://localhost:3000/**`

---

## 📧 **4. Check Email Templates**

**Supabase Dashboard → Authentication → Email Templates**

### **Confirm Signup Template:**

Make sure it includes:
```
{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=signup&redirect_to={{ .SiteURL }}/onboarding
```

**Default template should be fine, but verify:**
- [ ] Template is enabled
- [ ] Has proper redirect URL
- [ ] Uses `{{ .SiteURL }}` variable

---

## 🧪 **5. Test the Configuration**

After configuring SMTP:

### **Test 1: New Signup**
1. Open incognito/private window
2. Go to your live site
3. Sign up with a new email (use your real email for testing)
4. Check inbox (and spam folder!)
5. Should receive email within 1-2 minutes

### **Test 2: Resend**
1. On verification page, click "Resend Email"
2. Should see alert: "Verification email sent!"
3. Check inbox again

### **Test 3: Click Link**
1. Open verification email
2. Click the link
3. Should redirect to your site and mark as verified
4. Continue to onboarding

---

## 🔍 **Debugging**

### **Check Server Logs (Vercel)**

1. Go to Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Look for errors when clicking "Resend Email"
4. Should see detailed error message now (we added better logging)

### **Check Browser Console**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Resend Email"
4. Look for error message logged
5. Share the error with me if still stuck

### **Common Error Messages:**

**"Failed to resend verification email: Email rate limit exceeded"**
- **Fix:** You've hit Supabase's email limit - set up custom SMTP

**"Failed to resend verification email: Invalid SMTP configuration"**
- **Fix:** Check your SMTP settings, username/password might be wrong

**"Failed to resend verification email: Sender not verified"**
- **Fix:** Verify your sender email in SendGrid/Mailgun

**"Not authenticated"**
- **Fix:** User session expired - refresh page and try again

---

## 📝 **Quick Reference: SendGrid Setup (Most Recommended)**

```
1. Sign up: https://signup.sendgrid.com/
2. Verify your email
3. Create API key: Dashboard → API Keys → Create
4. Verify sender: Dashboard → Sender Authentication → Verify Single Sender
5. Add to Supabase:
   - Host: smtp.sendgrid.net
   - Port: 587
   - User: apikey
   - Pass: [Your API key]
   - From: [Your verified email]
```

**That's it!** Emails should work within 5 minutes.

---

## ✅ **After Fix Checklist**

- [ ] SMTP configured in Supabase
- [ ] Site URL set to production domain
- [ ] Redirect URLs added
- [ ] Tested new signup - email received
- [ ] Tested resend - email received
- [ ] Tested verification link - works
- [ ] Checked spam folder (mark as "not spam" if needed)

---

## 💡 **Pro Tips**

1. **Use SendGrid for production** - Most reliable free option
2. **Monitor email deliverability** - Check SendGrid dashboard for bounces/spam reports
3. **Keep localhost bypass** - Makes development easier (already added!)
4. **Set up custom domain** - Use your own domain in "From" email for better deliverability
5. **Add email warmup** - If sending lots of emails, gradually increase volume

---

## 🆘 **Still Not Working?**

If emails still won't send after following this guide:

1. **Check Supabase Status:** https://status.supabase.com/
2. **Check your spam folder**
3. **Try a different email provider** (Gmail, Yahoo, etc.)
4. **Contact Supabase support** - They can check server-side logs
5. **Share error logs** - Check Vercel logs and browser console

---

## 🎯 **Next Steps**

1. **Choose SMTP provider** (recommend SendGrid)
2. **Follow setup steps above**
3. **Configure in Supabase dashboard**
4. **Test with real signup**
5. **Verify it works**
6. **Deploy and celebrate!** 🎉

---

**Need Help?**

- Supabase Docs: https://supabase.com/docs/guides/auth/auth-smtp
- SendGrid Docs: https://docs.sendgrid.com/
- Email not in spam? Check: https://www.mail-tester.com/

**Status:** Ready to fix - just need SMTP configured!
