# Deploying to Vercel

This QR Code Manager application is optimized for easy deployment on Vercel. Follow these steps to get your app running in production.

## Prerequisites

1. A Vercel account (free tier available at [vercel.com](https://vercel.com))
2. A PostgreSQL database (recommended: Neon, Supabase, or PlanetScale)

## Quick Deploy

### Option 1: Deploy with Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
vercel

# Follow the prompts to configure your project
```

### Option 2: Deploy from GitHub
1. Push your code to a GitHub repository
2. Connect your GitHub account to Vercel
3. Import your repository in the Vercel dashboard
4. Vercel will automatically detect the configuration

## Environment Variables

Before deploying, you need to set up these environment variables in your Vercel project:

### Required Variables:
- `SESSION_SECRET`: A secure random string for session management
- `DATABASE_URL`: Your PostgreSQL database connection string

### Setting Environment Variables:
1. Go to your project dashboard on Vercel
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
SESSION_SECRET=your-secure-random-string-here
DATABASE_URL=postgresql://username:password@hostname:port/database
NODE_ENV=production
```

## Database Setup

### Option 1: Neon (Recommended)
1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string to your `DATABASE_URL` environment variable

### Option 2: Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy the connection string (ensure you use the pooling URL for better performance)

### Option 3: PlanetScale
1. Create a database at [planetscale.com](https://planetscale.com)
2. Create a connection string
3. Use the provided URL in your environment variables

## Important Notes

- The application uses in-memory storage by default, which resets with each deployment
- For persistent data, make sure to set up a proper database
- The session secret should be a long, random string for security
- QR codes will be accessible via short URLs in the format: `your-domain.vercel.app/r/shortcode`

## Troubleshooting

### Build Issues
If you encounter build issues:
1. Check that all environment variables are set
2. Ensure your database is accessible from Vercel
3. Verify your database URL format is correct

### 404 Not Found Error
If you see a 404 error after deployment:
1. Make sure the `vercel.json` configuration is properly set up
2. Verify the build output directory is correct (`dist/public`)
3. Check that the `vercel-build` script runs successfully
4. Redeploy after making configuration changes

### Database Connection Issues
- Make sure your database allows connections from Vercel's IP ranges
- For Neon/Supabase: connections should work automatically
- For self-hosted databases: you may need to whitelist Vercel's IPs

### Session Issues
- Ensure `SESSION_SECRET` is set and is a secure random string
- Check that `NODE_ENV` is set to "production"

## Features After Deployment

Once deployed, your QR Code Manager will support:
- User registration and authentication
- QR code generation with custom styling
- Short URL redirects (yourapp.vercel.app/r/shortcode)
- Click tracking and analytics
- Multiple QR code types (URL, text, email, phone, etc.)

## Need Help?

- Check Vercel's deployment logs in your dashboard
- Ensure all environment variables are correctly set
- Verify your database connection is working

Your app should be accessible at your Vercel domain once deployed!