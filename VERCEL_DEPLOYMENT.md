# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MySQL Database**: You'll need a cloud MySQL database
   - Options: PlanetScale, Railway, AWS RDS, DigitalOcean, or Aiven
3. **Vercel CLI**: Install with `npm i -g vercel`

---

## Step 1: Set Up Cloud Database

### Option A: PlanetScale (Recommended - Free Tier Available)

1. Sign up at [planetscale.com](https://planetscale.com)
2. Create a new database: "company-management"
3. Get connection details:
   - Host: `xxxxx.us-east-1.psdb.cloud`
   - Username: Your username
   - Password: Your password
   - Database: `company-management`

### Option B: Railway (Easy Setup)

1. Sign up at [railway.app](https://railway.app)
2. Create new project → Add MySQL
3. Copy connection details from Variables tab

### Option C: AWS RDS MySQL

1. Create RDS MySQL instance
2. Configure security group for public access
3. Note connection details

---

## Step 2: Initialize Database Schema

Run the database initialization script with your cloud database credentials:

```bash
# Set environment variables temporarily
$env:DB_HOST="your-cloud-db-host"
$env:DB_USER="your-username"
$env:DB_PASSWORD="your-password"
$env:DB_NAME="company_management"

# Run initialization
npm run init-db
```

Or manually run SQL commands from `database/init.js` using your database provider's console.

---

## Step 3: Configure Environment Variables in Vercel

### Via Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add the following variables:

```
DB_HOST=your-cloud-db-host
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=company_management
DB_PORT=3306
NODE_ENV=production
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d
```

### Via Vercel CLI:

```bash
vercel env add DB_HOST
# Enter value when prompted

vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
vercel env add DB_PORT
vercel env add NODE_ENV
vercel env add JWT_SECRET
vercel env add JWT_EXPIRE
```

---

## Step 4: Update Configuration for Vercel

The following files have been created for Vercel deployment:

1. ✅ `vercel.json` - Vercel configuration
2. ✅ `server-vercel.js` - Serverless-compatible server
3. ✅ `database/connection-serverless.js` - Serverless database connection

### Update package.json build script:

Already configured - no changes needed.

---

## Step 5: Deploy to Vercel

### Method A: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? company-management-system
# - Directory? ./
# - Override settings? No

# The app will be deployed!
```

### Method B: Deploy via GitHub Integration

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Company Management System"
   git branch -M main
   git remote add origin https://github.com/yourusername/company-management.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Click "Deploy"

---

## Step 6: Update Frontend API URL

After deployment, update the API URL in your frontend:

### For Production:

Edit `public/app.js`:
```javascript
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';
```

This is already configured to work automatically!

---

## Step 7: Test Deployment

After deployment completes:

1. **Visit your app**: `https://your-project-name.vercel.app`
2. **Test API**: `https://your-project-name.vercel.app/api/health`
3. **Test features**:
   - View employees
   - Add new employee
   - Upload photo
   - Search functionality

---

## Important Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

### Environment Variables Required
```
DB_HOST=your-cloud-db-host
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=company_management
DB_PORT=3306
NODE_ENV=production
JWT_SECRET=random-secret-key
```

---

## Deployment Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View deployment logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# View environment variables
vercel env ls

# Pull environment variables locally
vercel env pull
```

---

## Troubleshooting

### Issue: Database Connection Timeout

**Solution:** Check database security settings allow connections from Vercel IPs.

For PlanetScale/Railway: Usually no configuration needed
For AWS RDS: Update security group to allow all IPs (0.0.0.0/0)

### Issue: "Module not found" error

**Solution:** Ensure all dependencies are in `package.json`:
```bash
npm install
vercel
```

### Issue: API routes return 404

**Solution:** Check `vercel.json` routes configuration matches your API structure.

### Issue: Photos not uploading

**Solution:** 
1. Check body parser limit: `app.use(bodyParser.json({ limit: '10mb' }))`
2. Vercel has 5MB function payload limit - use external storage for larger photos

### Issue: Cold starts (slow first request)

**Solution:** This is normal for serverless. Consider:
- Upgrading Vercel plan for faster cold starts
- Using connection pooling service (PlanetScale recommended)
- Implementing warming function

---

## Performance Optimization

### 1. Database Connection Pooling

Use PlanetScale for automatic connection management in serverless.

### 2. Enable Caching

Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/employees",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 3. Optimize Photo Storage

For production with many photos, consider:
- Cloudinary for image hosting
- AWS S3 for file storage
- Vercel Blob for easy integration

---

## Security Considerations

1. **Environment Variables**: Never commit `.env` file
2. **Database Access**: Use strong passwords
3. **API Rate Limiting**: Consider implementing rate limiting
4. **HTTPS**: Automatically provided by Vercel
5. **CORS**: Configure for your domain only in production

---

## Continuous Deployment

### Automatic Deployments

With GitHub integration:
- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment
- Pull requests → Automatic preview links

### Manual Control

Add `vercel.json`:
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "preview": false
    }
  }
}
```

---

## Cost Considerations

### Vercel Free Tier:
- ✅ Unlimited deployments
- ✅ HTTPS included
- ✅ 100GB bandwidth/month
- ✅ Serverless function executions
- ⚠️ Limited to hobby projects

### Database Costs:
- **PlanetScale**: Free tier (1 database, 5GB storage, 1 billion row reads/month)
- **Railway**: $5/month after free trial
- **AWS RDS**: Starting ~$15/month

---

## Production Checklist

Before going live:

- [ ] Database initialized with production data
- [ ] Environment variables configured in Vercel
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Database backups configured
- [ ] API rate limiting implemented (optional)
- [ ] Error monitoring setup (Sentry, etc.)
- [ ] Analytics configured (optional)

---

## Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Documentation**: https://vercel.com/docs
- **PlanetScale**: https://planetscale.com
- **Railway**: https://railway.app
- **Project Status**: `vercel ls`

---

## Support

For deployment issues:
1. Check Vercel deployment logs: `vercel logs`
2. Review Vercel documentation
3. Check database connection settings
4. Verify environment variables are set

---

**Your app will be live at**: `https://your-project-name.vercel.app` 🚀
