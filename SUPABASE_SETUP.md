# 🚀 Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project name**: aksuite
   - **Database password**: (generate a strong password)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine

## Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the contents of `supabase/schema.sql`
4. Paste and run the query
5. You should see tables created: `profiles`, `passwords`

## Step 3: Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

## Step 4: Configure Environment Variables

1. Create `.env.local` file in project root
2. Add your keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_ENCRYPTION_KEY=generate-a-random-32-char-string
```

## Step 5: Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure email templates if needed

## Step 6: Test Locally

```bash
npm run dev
```

1. Click "Login / Sign Up"
2. Create an account
3. Add a password
4. Check Supabase dashboard → **Table Editor** → **passwords**
5. You should see your encrypted password!

## Step 7: Deploy to Vercel

1. Add environment variables in Vercel:
   - Go to your project → **Settings** → **Environment Variables**
   - Add all three variables from `.env.local`
2. Redeploy:
   ```bash
   vercel --prod
   ```

## 🔒 Security Features

- ✅ **Row Level Security (RLS)** enabled
- ✅ Users can only see/edit their own passwords
- ✅ Passwords are encrypted before storage
- ✅ Email/password authentication with Supabase Auth
- ✅ Automatic profile creation on signup

## 📊 Database Structure

### `profiles` table
- Links to Supabase auth.users
- Stores user metadata

### `passwords` table
- Linked to user_id (foreign key)
- Encrypted password storage
- Category organization
- Custom emojis

## 🎯 What's Next?

- [ ] Add master password for extra security
- [ ] Implement AES-256 encryption
- [ ] Add password strength meter
- [ ] Export/import functionality
- [ ] Two-factor authentication
- [ ] Browser extension
