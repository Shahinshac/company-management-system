# Company Management System

A professional company management system designed to handle multiple branches with comprehensive employee, department, project, and dependent tracking.

## Features

- **Employee Management**: Track employee details, work history, and assignments
  - **📸 Profile Photos**: Store and display employee photos in database
  - Personal information and contact details
  - Department assignments and history
  - Project assignments with role tracking
- **Department Management**: Manage departments with locations and managers
- **Project Management**: Handle projects across departments and locations
- **Dependent Tracking**: Maintain employee dependent information
- **Multi-Branch Support**: Designed to work seamlessly across all company branches
- **RESTful API**: Complete API for integration with any frontend

## Database Schema

Based on the ER diagram, the system includes:
- Employees with personal and professional details
- Departments with hierarchical management
- Projects with department associations
- Dependents linked to employees
- Work assignments tracking hours
- Manager relationships

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Initialize Database**
   ```bash
   npm run init-db
   ```

   **For existing installations** (add photo support):
   ```bash
   npm run migrate-photo
   ```

4. **Start Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/:id/projects` - Get employee projects
- `GET /api/employees/:id/dependents` - Get employee dependents

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create new department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department
- `GET /api/departments/:id/employees` - Get department employees

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/employees` - Get project employees

### Dependents
- `GET /api/dependents` - Get all dependents
- `POST /api/dependents` - Create new dependent
- `PUT /api/dependents/:id` - Update dependent
- `DELETE /api/dependents/:id` - Delete dependent

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT
- **Validation**: express-validator
- **Deployment**: Vercel-ready (serverless)

## Deployment

### Deploy to Vercel

This application is configured for easy deployment to Vercel:

```bash
# Quick deploy
npm run deploy-check  # Check if ready
vercel --prod         # Deploy to production
```

**Full deployment guide**: See [DEPLOY_QUICK.md](DEPLOY_QUICK.md) or [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

**Requirements:**
- Cloud MySQL database (PlanetScale, Railway, or AWS RDS)
- Vercel account (free tier available)
- Environment variables configured

## License

MIT
