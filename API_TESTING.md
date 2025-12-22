# API Testing Guide

## Using the API with Postman or Similar Tools

### Base URL
```
http://localhost:3000/api
```

## Employee Endpoints

### 1. Get All Employees
```
GET /api/employees
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "Id": 1,
      "Name": "John Smith",
      "Gender": "Male",
      "Email": "john.smith@company.com",
      "Phone": "555-0101",
      "Department_Name": "Engineering",
      "Salary": "75000.00"
    }
  ]
}
```

### 2. Create Employee
```
POST /api/employees
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "Jane Doe",
  "Gender": "Female",
  "Email": "jane.doe@company.com",
  "Phone": "555-9999",
  "Address": "456 Oak Street",
  "Dob": "1992-03-15",
  "Doj": "2024-01-15",
  "Department_No": "D001",
  "Since": "2024-01-15",
  "Salary": 70000,
  "Photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Note:** The `Photo` field accepts base64 encoded image data (max 5MB). Format: `data:image/[type];base64,[data]`

### 3. Get Employee by ID
```
GET /api/employees/1
```

### 4. Search Employees
```
GET /api/employees/search?q=john
```

### 5. Update Employee
```
PUT /api/employees/1
Content-Type: application/json
```

**Request Body:** (same as create, all fields)

### 6. Delete Employee
```
DELETE /api/employees/1
```

### 7. Get Employee Projects
```
GET /api/employees/1/projects
```

### 8. Get Employee Dependents
```
GET /api/employees/1/dependents
```

### 9. Assign Employee to Project
```
POST /api/employees/1/projects
Content-Type: application/json
```

**Request Body:**
```json
{
  "projectNo": "P001",
  "hours": 40,
  "role": "Developer"
}
```

## Department Endpoints

### 1. Get All Departments
```
GET /api/departments
```

### 2. Create Department
```
POST /api/departments
Content-Type: application/json
```

**Request Body:**
```json
{
  "D_No": "D006",
  "Name": "Research & Development",
  "Location": "Innovation Center",
  "Manager_Id": 1,
  "Manager_Start_Date": "2024-01-01"
}
```

### 3. Get Department Statistics
```
GET /api/departments/D002/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "D_No": "D002",
    "Name": "Engineering",
    "Total_Employees": 2,
    "Total_Projects": 1,
    "Average_Salary": "77500.00",
    "Total_Budget": "150000.00"
  }
}
```

### 4. Get Department Employees
```
GET /api/departments/D002/employees
```

### 5. Get Department Projects
```
GET /api/departments/D002/projects
```

## Project Endpoints

### 1. Get All Projects
```
GET /api/projects
```

### 2. Create Project
```
POST /api/projects
Content-Type: application/json
```

**Request Body:**
```json
{
  "P_No": "P005",
  "Name": "Mobile App Development",
  "Location": "Tech Park",
  "Department_No": "D002",
  "Budget": 250000,
  "Start_Date": "2024-06-01",
  "End_Date": "2024-12-31",
  "Status": "Planning"
}
```

**Status Options:**
- Planning
- Active
- Completed
- On Hold

### 3. Get Projects by Status
```
GET /api/projects/status/Active
```

### 4. Update Project Status
```
PATCH /api/projects/P001/status
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "Completed"
}
```

### 5. Get Project Statistics
```
GET /api/projects/P001/statistics
```

### 6. Get Project Employees
```
GET /api/projects/P001/employees
```

## Dependent Endpoints

### 1. Get All Dependents
```
GET /api/dependents
```

### 2. Create Dependent
```
POST /api/dependents
Content-Type: application/json
```

**Request Body:**
```json
{
  "Employee_Id": 1,
  "D_name": "Sarah Smith",
  "Gender": "Female",
  "Relationship": "Daughter",
  "Date_of_Birth": "2015-05-20"
}
```

### 3. Update Dependent
```
PUT /api/dependents/1
Content-Type: application/json
```

### 4. Delete Dependent
```
DELETE /api/dependents/1
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Error message"
}
```

## Testing Workflow

### 1. Complete Employee Lifecycle
```bash
# Create employee
POST /api/employees

# Get employee
GET /api/employees/6

# Assign to project
POST /api/employees/6/projects

# Update employee
PUT /api/employees/6

# Add dependent
POST /api/dependents

# Delete employee
DELETE /api/employees/6
```

### 2. Project Management Workflow
```bash
# Create project
POST /api/projects

# Assign employees
POST /api/employees/1/projects
POST /api/employees/2/projects

# Check project stats
GET /api/projects/P005/statistics

# Update status
PATCH /api/projects/P005/status

# Complete project
PATCH /api/projects/P005/status (status: "Completed")
```

### 3. Department Analytics
```bash
# Get department
GET /api/departments/D002

# Get statistics
GET /api/departments/D002/statistics

# Get all employees
GET /api/departments/D002/employees

# Get all projects
GET /api/departments/D002/projects
```

## Tips for Testing

1. **Use Postman Collections**: Create a collection with all endpoints for easy testing
2. **Environment Variables**: Set up base URL as environment variable
3. **Pre-request Scripts**: Add authentication tokens if implemented
4. **Test Data**: Use the sample data created by init-db script
5. **Validation Testing**: Try invalid data to test validation
6. **Edge Cases**: Test with null values, empty strings, special characters

## Postman Collection Import

You can import these endpoints into Postman by creating a new collection with the above requests. Each request should include:
- Method (GET, POST, PUT, DELETE, PATCH)
- URL with parameters
- Headers (Content-Type: application/json for POST/PUT/PATCH)
- Body (raw JSON) for POST/PUT/PATCH requests
