# Resend Email Setup Guide

This guide will help you set up Resend for the contact and support email functionality.

## ✅ Packages Installed

The following packages are already installed:
- `resend`
- `@react-email/components`
- `@react-email/render`
- `react-email`

## Configuration

1. **Get your Resend API key:**
   - Go to https://resend.com/api-keys
   - Create a new API key
   - Copy the key

2. **Add environment variables to your `.env.local` file:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
CONTACT_EMAIL=contact@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
FROM_EMAIL=Summaryr <onboarding@resend.dev>
```

   **Note:** For development/testing, you can use `onboarding@resend.dev` as the `FROM_EMAIL`. For production, you'll need to verify your domain in Resend and use your verified email address.

3. **Verify your domain in Resend (for production):**
   - Go to https://resend.com/domains
   - Add and verify your domain
   - Update `FROM_EMAIL` in your `.env.local` with your verified domain

## Email Functionality

The email functionality is **already enabled** in:
- `app/api/contact/route.ts` - Handles contact form submissions
- `app/api/support/route.ts` - Handles support requests

Both routes:
- Use React Email templates for professional email formatting
- Send emails to your team (contact/support)
- Send confirmation emails to users
- Include proper error handling

## Email Templates

The email templates are located in:
- `emails/contact-email.tsx` - Contact form email template
- `emails/support-email.tsx` - Support request email template

You can customize these templates as needed.

## Testing

1. Add your `RESEND_API_KEY` to `.env.local`
2. Set `CONTACT_EMAIL` and `SUPPORT_EMAIL` to your email addresses
3. Use `onboarding@resend.dev` for `FROM_EMAIL` during development
4. Test the contact and support forms
5. Check your email inbox for the submissions

## Production

Before going to production:
1. Verify your domain in Resend
2. Update `FROM_EMAIL` to use your verified domain (e.g., `Summaryr <noreply@yourdomain.com>`)
3. Ensure all environment variables are set in your production environment
4. Test email delivery in production

## Notes

- The API routes will return an error if `RESEND_API_KEY` is not set
- Emails are sent asynchronously - the API will return success even if email delivery fails
- Check Resend dashboard for email delivery status and logs

