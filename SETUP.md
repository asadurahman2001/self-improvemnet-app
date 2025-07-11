# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- A Supabase account

## Step-by-Step Setup

### 1. Environment Setup
```bash
# Clone and install
git clone <repository-url>
cd life-tracker
npm install

# Copy environment template
cp .env.example .env
```

### 2. Supabase Project Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and enter project details
   - Wait for project initialization (2-3 minutes)

2. **Get API Credentials**
   - Go to Project Settings → API
   - Copy "Project URL" and "anon public" key
   - Paste them into your `.env` file

### 3. Database Setup

1. **Run Database Migration**
   - Open Supabase SQL Editor
   - Copy contents of `database_setup.sql`
   - Paste and run in SQL Editor
   - Verify tables are created in Table Editor

2. **Verify Setup**
   - Check that all tables exist in the Table Editor
   - Ensure RLS (Row Level Security) is enabled on all tables

### 4. Start Application

```bash
npm run dev
```

Visit `http://localhost:5173` and create your account!

## Troubleshooting

### Common Issues

**"Invalid API key" error:**
- Double-check your `.env` file has the correct Supabase URL and anon key
- Ensure no extra spaces or quotes around the values

**Database connection issues:**
- Verify the database migration ran successfully
- Check that RLS policies are in place
- Ensure your Supabase project is active

**Build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node --version` (should be 18+)

### Getting Help

1. Check the browser console for error messages
2. Verify Supabase project status in the dashboard
3. Ensure all environment variables are set correctly
4. Open an issue if problems persist

## Next Steps

After setup:
1. Create your user account
2. Set up your profile information
3. Configure your daily goals
4. Start tracking your activities!

The app includes sample data and helpful tooltips to guide you through each feature.