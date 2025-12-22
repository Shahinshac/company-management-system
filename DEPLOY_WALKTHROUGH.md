# 🚀 Deploy to Vercel - Complete Walkthrough

## What You'll Deploy

Your Company Management System will be hosted on:
- **Frontend**: Vercel (static files + serverless functions)
- **Backend API**: Vercel Serverless Functions
- **Database**: Cloud MySQL (PlanetScale/Railway/AWS RDS)

**Result**: A fully functional web app accessible worldwide at `https://your-app.vercel.app`

---

## Before You Start

Make sure you have:
- ✅ Node.js installed (v14+)
- ✅ Git installed
- ✅ Vercel account ([Sign up free](https://vercel.com/signup))
- ✅ Code editor (VS Code)

---

## Part 1: Setup Cloud Database (10 minutes)

### Option 1: PlanetScale (Recommended - Best for Serverless)

**Why PlanetScale?**
- ✅ Free tier (generous limits)
- ✅ Built for serverless
- ✅ No connection pooling issues
- ✅ Automatic scaling

**Steps:**

1. **Sign up**: Go to [planetscale.com](https://planetscale.com) → Click "Get Started"

2. **Create database**:
   ```
   - Click "Create Database"
   - Name: company-management
   - Region: Choose closest to you (e.g., US East)
   - Click "Create database"
   ```

3. **Get credentials**:
   ```
   - Click "Connect" button
   - Select "Node.js"
   - Copy the connection details:
     * Host: xxx.us-east-1.psdb.cloud
     * Username: your-username
     * Password: your-password
   ```

4. **Save credentials** - you'll need them soon!

### Option 2: Railway (Easiest Setup)

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. New Project → Add MySQL
3. Click MySQL service → Variables tab
4. Copy: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`

---

## Part 2: Initialize Database (5 minutes)

Now we'll create the tables in your cloud database.

### On Your Computer:

1. **Open PowerShell in project folder**:
   ```powershell
   cd c:\Users\Shahinsha\.vscode\company
   ```

2. **Set environment variables** (use YOUR database credentials):
   ```powershell
   $env:DB_HOST="your-planetscale-host.cloud"
   $env:DB_USER="your-username"
   $env:DB_PASSWORD="your-password"
   $env:DB_NAME="company_management"
   ```

3. **Run initialization**:
   ```powershell
   npm run init-db
   ```

   You should see:
   ```
   Database created or already exists
   EMPLOYEE table created
   DEPARTMENT table created
   ...
   ✅ Database initialization completed successfully!
   ```

**Important**: Keep these credentials - you'll add them to Vercel next!

---

## Part 3: Deploy to Vercel (5 minutes)

### Step 1: Install Vercel CLI

```powershell
npm install -g vercel
```

### Step 2: Login to Vercel

```powershell
vercel login
```

This will open your browser. Confirm the login.

### Step 3: Deploy (First Time)

```powershell
vercel
```

You'll be asked questions:

```
? Set up and deploy? › Yes
? Which scope? › Your Name (personal account)
? Link to existing project? › No
? What's your project's name? › company-management
? In which directory is your code located? › ./
```

**Wait for deployment...** (~2 minutes)

You'll get a URL like: `https://company-management-abc123.vercel.app`

⚠️ **Don't test yet!** We need to add database credentials first.

### Step 4: Add Environment Variables

**Via Vercel Dashboard** (Easier):

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project: "company-management"
3. Go to Settings → Environment Variables
4. Add these variables (one by one):

   | Name | Value | Environment |
   |------|-------|-------------|
   | DB_HOST | your-database-host.cloud | Production, Preview, Development |
   | DB_USER | your-username | Production, Preview, Development |
   | DB_PASSWORD | your-password | Production, Preview, Development |
   | DB_NAME | company_management | Production, Preview, Development |
   | DB_PORT | 3306 | Production, Preview, Development |
   | NODE_ENV | production | Production |
   | JWT_SECRET | random-secret-string-123 | Production, Preview, Development |

5. Click "Save" for each

**Via CLI** (Alternative):

```powershell
vercel env add DB_HOST
# Paste your host when prompted, select all environments

vercel env add DB_USER
# Paste your username

vercel env add DB_PASSWORD
# Paste your password

vercel env add DB_NAME
# Type: company_management

vercel env add DB_PORT
# Type: 3306

vercel env add NODE_ENV
# Type: production (only for Production environment)

vercel env add JWT_SECRET
# Type any random string
```

### Step 5: Deploy to Production

Now deploy with environment variables:

```powershell
vercel --prod
```

**This deploys to production!** You'll get your final URL:
```
🎉 Production: https://company-management.vercel.app
```

---

## Part 4: Test Your Deployment (2 minutes)

### 1. Test API Health

Open in browser:
```
https://your-app.vercel.app/api/health
```

Should show:
```json
{
  "status": "OK",
  "message": "Company Management System API is running"
}
```

### 2. Test Main Dashboard

Open:
```
https://your-app.vercel.app
```

You should see:
- ✅ Statistics dashboard (Total Employees: 5, etc.)
- ✅ Employee list with sample data
- ✅ All tabs working (Employees, Departments, Projects, Dependents)

### 3. Test Adding Employee

1. Click "+ Add Employee"
2. Fill in details
3. Upload a photo
4. Click "Save Employee"
5. Should appear in the list!

---

## Part 5: Custom Domain (Optional)

### Add Your Own Domain

1. **Buy a domain** (e.g., from Namecheap, GoDaddy)

2. **In Vercel Dashboard**:
   ```
   Project Settings → Domains
   → Add Domain
   → Enter: company.yourdomain.com
   ```

3. **Update DNS** (at your domain registrar):
   ```
   Type: CNAME
   Name: company
   Value: cname.vercel-dns.com
   ```

4. **Wait for verification** (few minutes)

5. **Done!** Your app is now at `https://company.yourdomain.com`

---

## 🎉 Congratulations!

Your Company Management System is now live!

### Your URLs:
- **Production**: https://your-app.vercel.app
- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Project Settings**: Your project → Settings

### What Works:
- ✅ Employee management with photos
- ✅ Department management
- ✅ Project tracking
- ✅ Dependent records
- ✅ Search functionality
- ✅ API endpoints
- ✅ Automatic HTTPS
- ✅ Global CDN

---

## Updating Your App

### Make Changes Locally

1. Edit files as needed
2. Test locally: `npm run dev`

### Deploy Updates

```powershell
# Quick deploy
vercel --prod

# Or with Git (if connected)
git add .
git commit -m "Update features"
git push
# Automatically deploys!
```

---

## Monitoring

### View Logs

```powershell
vercel logs
```

### View Analytics

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project
3. See real-time visitors, requests, performance

---

## Troubleshooting

### "Cannot connect to database"

**Check:**
1. Environment variables are set in Vercel
2. Database allows connections (security settings)
3. Credentials are correct

**Fix:**
```powershell
vercel env ls  # List environment variables
# Add any missing ones
```

### "API returns 404"

**Check:**
- `vercel.json` exists in project root
- Routes are configured correctly

**Fix:**
```powershell
# Redeploy
vercel --prod --force
```

### "Photos not uploading"

**Check:**
- Photo size < 5MB
- Body parser configured: `{ limit: '10mb' }`

**Fix:** Already configured in `server.js`

### "Slow first request"

**Cause:** Cold starts (normal for serverless)

**Solution:**
- Use PlanetScale (optimized for serverless)
- Upgrade Vercel plan for faster cold starts
- First request always slower (~2-3 seconds)

---

## Cost Breakdown

### Free Tier (Hobby):
- **Vercel**: Free (100GB bandwidth/month)
- **PlanetScale**: Free (5GB storage, 1B row reads/month)
- **Total**: $0/month

### If You Grow:
- **Vercel Pro**: $20/month (unlimited bandwidth)
- **PlanetScale Pro**: $29/month (more storage)

**Perfect for:** Small to medium businesses (up to 1000 employees)

---

## Next Steps

1. **Add team members**: Invite colleagues in Vercel dashboard
2. **Setup monitoring**: Add Sentry for error tracking
3. **Backup database**: Enable automatic backups in PlanetScale
4. **Custom domain**: Add your company domain
5. **API documentation**: Share API endpoints with team

---

## Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **PlanetScale Docs**: [docs.planetscale.com](https://docs.planetscale.com)
- **Your Deployment Logs**: `vercel logs`
- **Project Files**: 
  - `VERCEL_DEPLOYMENT.md` - Detailed guide
  - `DEPLOY_QUICK.md` - Quick reference

---

## Emergency Rollback

If something goes wrong:

```powershell
# List deployments
vercel ls

# Rollback to previous version
vercel rollback [deployment-url]
```

---

**🎊 Your app is live! Share it with your team!**

URL: https://your-app.vercel.app

---

Need help? Run: `npm run deploy-check` to verify setup
