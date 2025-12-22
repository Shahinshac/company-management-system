#!/usr/bin/env node

/**
 * Vercel Pre-deployment Check
 * Run this before deploying to catch common issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Pre-deployment Checks...\n');

let hasErrors = false;

// Check 1: Required files exist
console.log('📁 Checking required files...');
const requiredFiles = [
  'vercel.json',
  'server.js',
  'package.json',
  'public/index.html',
  'public/app.js'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, '..', file))) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING!`);
    hasErrors = true;
  }
});

// Check 2: package.json has required dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')));
const requiredDeps = ['express', 'mysql2', 'cors', 'body-parser', 'dotenv'];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`  ✅ ${dep}`);
  } else {
    console.log(`  ❌ ${dep} - MISSING!`);
    hasErrors = true;
  }
});

// Check 3: Environment variables documented
console.log('\n🔐 Required Environment Variables (set these in Vercel):');
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_PORT',
  'NODE_ENV',
  'JWT_SECRET'
];

requiredEnvVars.forEach(envVar => {
  console.log(`  ⚙️  ${envVar}`);
});

// Check 4: vercel.json is valid JSON
console.log('\n📝 Checking vercel.json...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json')));
  if (vercelConfig.version === 2) {
    console.log('  ✅ Valid Vercel configuration');
  } else {
    console.log('  ⚠️  Vercel config version might be outdated');
  }
} catch (error) {
  console.log('  ❌ Invalid vercel.json - ' + error.message);
  hasErrors = true;
}

// Check 5: .gitignore includes .vercel
console.log('\n🚫 Checking .gitignore...');
if (fs.existsSync(path.join(__dirname, '..', '.gitignore'))) {
  const gitignore = fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8');
  if (gitignore.includes('.vercel')) {
    console.log('  ✅ .vercel directory ignored');
  } else {
    console.log('  ⚠️  Consider adding .vercel to .gitignore');
  }
} else {
  console.log('  ⚠️  No .gitignore found');
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Pre-deployment checks FAILED');
  console.log('   Fix the errors above before deploying');
  process.exit(1);
} else {
  console.log('✅ Pre-deployment checks PASSED');
  console.log('   Ready to deploy!\n');
  console.log('📋 Next steps:');
  console.log('   1. Setup cloud database (PlanetScale/Railway)');
  console.log('   2. Run: npm run init-db (with cloud DB credentials)');
  console.log('   3. Set environment variables in Vercel');
  console.log('   4. Run: vercel --prod');
  console.log('\n📖 See DEPLOY_QUICK.md for detailed instructions');
  process.exit(0);
}
