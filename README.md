# Company Management System

A complete web application to manage companies, employees, work relationships, and management hierarchies.

## Database Schema

Based on the ER diagram with 4 main tables:

```
┌─────────────┐       ┌─────────────┐
│   company   │       │    works    │
├─────────────┤       ├─────────────┤
│ company_name│◄──────│ emp_id      │
│ city        │       │ company_name│
└─────────────┘       │ salary      │
                      └──────┬──────┘
                             │
┌─────────────┐              │
│  employee   │◄─────────────┘
├─────────────┤       
│ emp_id      │◄──────┐
│ emp_name    │       │
│ street_no   │       │
│ city        │       │
└─────────────┘       │
                      │
┌─────────────┐       │
│   manages   │       │
├─────────────┤       │
│ emp_id      │───────┘
│ manager_id  │───────┘
└─────────────┘
```

## Features

- **Companies**: Create, edit, delete companies with city information
- **Employees**: Manage employee records with address details
- **Works**: Track which employees work for which companies and their salaries
- **Manages**: Define management hierarchies between employees
- **Authentication**: JWT-based login system
- **Dashboard**: Overview statistics and salary analytics

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=company_db
DB_PORT=3306
JWT_SECRET=your-secret-key
PORT=3000
```

### 3. Initialize Database
```bash
npm run init-db
```

### 4. Start Server
```bash
npm start
# or for development
npm run dev
```

### 5. Access Application
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

**Default Login:**
- Username: `admin`
- Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `POST /api/auth/change-password` - Change password

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/:name` - Get company by name
- `GET /api/companies/:name/employees` - Get company employees
- `POST /api/companies` - Create company
- `PUT /api/companies/:name` - Update company
- `DELETE /api/companies/:name` - Delete company

### Employees
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee by ID
- `GET /api/employees/:id/works` - Get employee work history
- `GET /api/employees/:id/subordinates` - Get subordinates
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Works (Employee-Company Relationships)
- `GET /api/works` - List all work relationships
- `GET /api/works/stats` - Get salary statistics
- `POST /api/works` - Create work relationship
- `PUT /api/works/:empId/:companyName` - Update salary
- `DELETE /api/works/:empId/:companyName` - Delete relationship

### Manages (Management Hierarchy)
- `GET /api/manages` - List all management relationships
- `GET /api/manages/managers` - Get all managers
- `POST /api/manages` - Assign manager to employee
- `DELETE /api/manages/:empId` - Remove management relationship

## Project Structure

```
company/
├── database/
│   ├── connection.js    # Database connection pool
│   └── init.js          # Database initialization
├── middleware/
│   └── authMiddleware.js # JWT authentication
├── models/
│   ├── Company.js       # Company model
│   ├── Employee.js      # Employee model
│   ├── Works.js         # Works relationship model
│   ├── Manages.js       # Management model
│   └── User.js          # User authentication model
├── routes/
│   ├── authRoutes.js    # Authentication routes
│   ├── companyRoutes.js # Company CRUD
│   ├── employeeRoutes.js# Employee CRUD
│   ├── worksRoutes.js   # Works CRUD
│   ├── managesRoutes.js # Management CRUD
│   └── userRoutes.js    # User management
├── public/
│   ├── index.html       # Main dashboard
│   ├── login.html       # Login page
│   └── app.js           # Frontend JavaScript
├── server.js            # Express server
├── package.json
└── .env.example
```

## Technologies

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Password Hashing**: bcryptjs

## License

MIT
