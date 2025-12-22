# 🚀 Deploy Your Company Management System - Simple Steps

Your code is already on GitHub and Vercel! Just need to complete the setup.

**GitHub Repository:** https://github.com/Shahinshac/company-management-system  
**Vercel Dashboard:** https://vercel.com/shahinshacs-projects/company-mgmt-system

---

## Step 1: Create a Free MySQL Database

### Option A: Aiven (Recommended - Free Forever)

1. **Go to Aiven**
   ```
   https://aiven.io
   ```

2. **Sign up** (free tier - no credit card required)

3. **Click "Create Service"**
   - Select "MySQL"
   - Choose "Free" plan
   - Select region closest to you
   - Click "Create Service"

4. **Wait 2-3 minutes** for database to start

5. **Copy your database credentials:**
   - Click on your MySQL service
   - Scroll to "Connection Information"
   - Copy: Host, Port, User, Password, Database name
   - Keep this tab open

---

### Option B: FreeSQLDatabase.com (100% Free)

1. **Go to FreeSQLDatabase**
   ```
   https://www.freesqldatabase.com
   ```

2. **Click "Sign Up"**

3. **Fill the form:**
   - Database Name: `company_db`
   - Your email
   - Click "Create Database"

4. **Check your email** for credentials

5. **You'll receive:**
   - Server/Host
   - Username
   - Password
   - Database Name
   - Port (usually 3306)

---

### Option C: db4free.net (Simple & Free)

1. **Go to db4free**
   ```
   https://www.db4free.net
   ```

2. **Click "Sign Up"**

3. **Create account:**
   - Database Name: `companydb` (no underscores)
   - Username: (your choice)
   - Password: (your choice)
   - Email: (your email)

4. **Your credentials:**
   ```
   Host: db4free.net
   Port: 3306
   Database: companydb (the name you chose)
   Username: (what you chose)
   Password: (what you chose)
   ```

---

## Step 2: Setup Database Tables

1. **Create `.env` file in your project folder**

   Copy and paste this, then **replace with your actual database values:**

   ```env
   DB_HOST=your-database-host.railway.app
   DB_USER=root
   DB_PASSWORD=your-password-here
   DB_NAME=railway
   DB_PORT=3306
   NODE_ENV=development
   JWT_SECRET=your-secret-key-change-this-to-something-random
   ```

   **Example with FreeSQLDatabase:**
   ```env
   DB_HOST=sql123.freesqldatabase.com
   DB_USER=sql123456_user
   DB_PASSWORD=Kx7mP9nQ2wR5tY8u
   DB_NAME=sql123456_company
   DB_PORT=3306
   NODE_ENV=development
   JWT_SECRET=mycompany2024secretkey
   ```

   **Example with db4free:**
   ```env
   DB_HOST=db4free.net
   DB_USER=myusername
   DB_PASSWORD=mypassword123
   DB_NAME=companydb
   DB_PORT=3306
   NODE_ENV=development
   JWT_SECRET=mycompany2024secretkey
   ```

2. **Install dependencies** (if you haven't already)

   ```bash
   npm install
   ```

3. **Initialize the database with tables and sample data**

   ```bash
   npm run init-db
   ```

   ✅ You should see: "Database initialized successfully!"

---

## Step 3: Test Locally (Optional but Recommended)

1. **Start the server**

   ```bash
   npm start
   ```

2. **Open your browser**

   ```
   http://localhost:3000
   ```

3. **Check if it works:**
   - You should see the dashboard
   - Try adding an employee with a photo
   - If everything works, you're ready to deploy!

4. **Stop the server** (Press `Ctrl+C` in terminal)

---

## Step 4: Add Environment Variables to Vercel

1. **Go to Vercel Settings**
   ```
   https://vercel.com/shahinshacs-projects/company-mgmt-system/settings/environment-variables
   ```

2. **Add each variable** (click "Add New" for each one):

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `DB_HOST` | Your database host (from Step 1) | Production |
   | `DB_USER` | Your database user | Production |
   | `DB_PASSWORD` | Your database password | Production |
   | `DB_NAME` | Your database name | Production |
   | `DB_PORT` | Your database port | Production |
   | `NODE_ENV` | `production` | Production |
   | `JWT_SECRET` | `mycompany2024secretkey` (or your own) | Production |

   **Important:** Select "Production" for each variable's environment!

---

## Step 5: Redeploy on Vercel

### Option A: From Terminal

```bash
vercel --prod
```

### Option B: From Vercel Dashboard

1. Go to: https://vercel.com/shahinshacs-projects/company-mgmt-system
2. Click "Deployments" tab
3. Click "..." (three dots) on the latest deployment
4. Click "Redeploy"

---

## Step 6: Access Your Live App!

Wait 1-2 minutes for deployment to complete, then visit:

```
https://company-mgmt-system.vercel.app
```

Or check your custom URL in the Vercel dashboard.

---

## 🎉 You're Done!

Your company management system is now live on the internet!

### What You Can Do Now:

✅ **Add employees with photos**  
✅ **Manage departments**  
✅ **Create projects**  
✅ **Track employee assignments**  
✅ **Access from any branch - same database**

---

## 🔧 Troubleshooting

### "Cannot connect to database"
- Check your environment variables in Vercel are correct
- Make sure your database service is running (check the provider's website)
- Verify the database allows remote connections (all free options above do)
- For db4free: Sometimes slow, wait a minute and try again

### "Application Error"
- Go to Vercel dashboard → Logs
- Check what the error says
- Most common: environment variables not set

### Database is slow
- Free databases can be slower than paid ones
- db4free.net is for testing/learning, not production
- Consider upgrading to paid hosting for better performance

### Need Help?
1. Check Vercel logs: https://vercel.com/shahinshacs-projects/company-mgmt-system/logs
2. Check database provider website is working
3. Verify all environment variables are set in Vercel
4. Test database connection locally first (Step 3)

---

## 📱 Share Your App

Your app URL:
```
https://company-mgmt-system.vercel.app
```

Share this link with your team - they can access it from anywhere!

---

## 🔄 Future Updates

When you make code changes:

1. **Commit to GitHub:**
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```

2. **Vercel automatically redeploys!** ✨

That's it - any push to GitHub automatically updates your live site.
