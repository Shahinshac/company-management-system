# Quick Vercel Deployment

## 🚀 Fast Deploy (5 Minutes)

### Step 1: Install Vercel CLI
```powershell
npm install -g vercel
```

### Step 2: Setup Database (Choose One)

**Option A: PlanetScale (Recommended)**
1. Go to [planetscale.com](https://planetscale.com) → Sign up
2. Create database: "company-management"
3. Get connection string

**Option B: Railway**
1. Go to [railway.app](https://railway.app) → New Project
2. Add MySQL → Copy credentials

### Step 3: Deploy
```powershell
# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variables when prompted
```

### Step 4: Set Environment Variables

Via Vercel CLI:
```powershell
vercel env add DB_HOST
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
vercel env add NODE_ENV
```

Or via Dashboard: vercel.com → Your Project → Settings → Environment Variables

### Step 5: Initialize Database
```powershell
# Set your cloud DB credentials
$env:DB_HOST="your-planetscale-host"
$env:DB_USER="your-username"
$env:DB_PASSWORD="your-password"
$env:DB_NAME="company_management"

# Run init script
npm run init-db
```

### Step 6: Deploy to Production
```powershell
vercel --prod
```

**Done!** Your app is live at: `https://your-project.vercel.app` 🎉

---

## 📋 Environment Variables Needed

```
DB_HOST=your-database-host.com
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=company_management
DB_PORT=3306
NODE_ENV=production
JWT_SECRET=change-this-random-string
JWT_EXPIRE=7d
```

---

## 🔧 Quick Commands

```powershell
# Deploy
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Open in browser
vercel open
```

---

## ✅ Deployment Checklist

- [ ] Vercel CLI installed
- [ ] Cloud database created (PlanetScale/Railway)
- [ ] Database initialized (tables created)
- [ ] Environment variables set in Vercel
- [ ] Deployed with `vercel --prod`
- [ ] Tested at your-app.vercel.app

---

## 🐛 Common Issues

**"Cannot connect to database"**
→ Check DB credentials in environment variables

**"API returns 404"**
→ Ensure vercel.json exists in project root

**"Photos not uploading"**
→ Check Vercel logs: `vercel logs`

---

## 📚 Full Guide

See `VERCEL_DEPLOYMENT.md` for detailed instructions.

---

**Need help?** Check deployment logs: `vercel logs`
