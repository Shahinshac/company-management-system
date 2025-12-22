# Company Management System - Quick Start Guide

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v5.7 or higher)
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` file with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=company_management
DB_PORT=3306

PORT=3000
NODE_ENV=development

JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

### 3. Initialize Database

Run the database initialization script to create tables and insert sample data:

```bash
npm run init-db
```

This will:
- Create the database if it doesn't exist
- Create all required tables (EMPLOYEE with Photo field, DEPARTMENT, PROJECT, DEPENDENT, WORKS_ON)
- Insert sample data for testing

**If you're updating an existing database**, run the migration:
```bash
npm run migrate-photo
```
This adds the Photo column to existing EMPLOYEE tables.

### 4. Start the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

### 5. Access the Application

Open your browser and navigate to:
- **Web Dashboard:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/api/health

## API Endpoints Reference

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `GET /api/employees/search?q=term` - Search employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/:id/projects` - Get employee projects
- `GET /api/employees/:id/dependents` - Get employee dependents

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:dNo` - Get department by number
- `GET /api/departments/:dNo/employees` - Get department employees
- `GET /api/departments/:dNo/projects` - Get department projects
- `GET /api/departments/:dNo/statistics` - Get department statistics
- `POST /api/departments` - Create new department
- `PUT /api/departments/:dNo` - Update department
- `DELETE /api/departments/:dNo` - Delete department

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:pNo` - Get project by number
- `GET /api/projects/status/:status` - Get projects by status
- `GET /api/projects/:pNo/employees` - Get project employees
- `GET /api/projects/:pNo/statistics` - Get project statistics
- `POST /api/projects` - Create new project
- `PUT /api/projects/:pNo` - Update project
- `PATCH /api/projects/:pNo/status` - Update project status
- `DELETE /api/projects/:pNo` - Delete project

### Dependents
- `GET /api/dependents` - Get all dependents
- `GET /api/dependents/:id` - Get dependent by ID
- `POST /api/dependents` - Create new dependent
- `PUT /api/dependents/:id` - Update dependent
- `DELETE /api/dependents/:id` - Delete dependent

## Sample API Requests

### Create Employee
```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "John Doe",
    "Gender": "Male",
    "Email": "john.doe@company.com",
    "Phone": "555-1234",
    "Address": "123 Main St",
    "Dob": "1990-01-15",
    "Doj": "2024-01-01",
    "Department_No": "D002",
    "Since": "2024-01-01",
    "Salary": 75000
  }'
```

### Get Department Statistics
```bash
curl http://localhost:3000/api/departments/D002/statistics
```

### Update Project Status
```bash
curl -X PATCH http://localhost:3000/api/projects/P001/status \
  -H "Content-Type: application/json" \
  -d '{"status": "Active"}'
```

## Database Schema

The system implements the following database structure based on the ER diagram:

### Tables

1. **EMPLOYEE**
   - Id (PK)
   - Name, Gender, Address
   - Dob, Doj
   - Department_No (FK)
   - Since, Salary
   - Email, Phone
   - **Photo** (LONGTEXT - stores base64 encoded images)

2. **DEPARTMENT**
   - D_No (PK)
   - Name, Location
   - Manager_Id (FK to EMPLOYEE)
   - Manager_Start_Date

3. **PROJECT**
   - P_No (PK)
   - Name, Location
   - Department_No (FK)
   - Budget, Start_Date, End_Date
   - Status

4. **DEPENDENT**
   - Id (PK)
   - Employee_Id (FK)
   - D_name, Gender
   - Relationship
   - Date_of_Birth

5. **WORKS_ON** (Junction Table)
   - Employee_Id (PK, FK)
   - Project_No (PK, FK)
   - Hours
   - Assignment_Date, Role

## Multi-Branch Support

The system is designed to support multiple company branches through:

1. **Centralized Database**: All branches connect to the same database
2. **Location Fields**: Departments and Projects have location fields for branch identification
3. **API Architecture**: RESTful API can be accessed from any branch
4. **Scalability**: Database connection pooling for handling multiple concurrent connections

## Troubleshooting

### Cannot connect to database
- Ensure MySQL server is running
- Verify credentials in `.env` file
- Check if port 3306 is not blocked

### Port 3000 already in use
- Change PORT in `.env` file
- Or stop the process using port 3000

### Sample data not showing
- Run `npm run init-db` again
- Check MySQL permissions

## Security Notes

⚠️ **Important for Production:**
- Change JWT_SECRET to a strong random string
- Use environment-specific credentials
- Enable HTTPS
- Implement rate limiting
- Add authentication middleware
- Sanitize all user inputs

## Support

For issues or questions:
1. Check the README.md file
2. Review API documentation at http://localhost:3000/api
3. Check server logs for errors

## License

MIT License - See LICENSE file for details
