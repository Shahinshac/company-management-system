const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Authentication check
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    
    return { token, user };
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Load config (company name)
    try {
        const cfg = await fetch(`${API_URL}/config`).then(r => r.json());
        const nameEl = document.getElementById('companyName');
        if (cfg && cfg.companyName && nameEl) nameEl.textContent = cfg.companyName;
    } catch (e) {
        // ignore
    }

    const auth = checkAuth();
    if (!auth) return;
    
    // Display user info
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerHTML = `
            <span>Welcome, <strong>${auth.user.username}</strong> (${auth.user.role})</span>
            <button onclick="logout()" class="logout-btn">Logout</button>
        `;
    }
    
    // Show/hide admin sections
    if (auth.user.role === 'Admin') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
        loadPendingUsers();
    }
    
    loadDashboardStats();
    loadEmployees();
    loadDepartmentOptions();
});

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Load data for selected tab
    switch(tabName) {
        case 'employees':
            loadEmployees();
            break;
        case 'departments':
            loadDepartments();
            break;
        case 'projects':
            loadProjects();
            break;
        case 'dependents':
            loadDependents();
            break;
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const headers = getAuthHeaders();
        const [employees, departments, projects, dependents] = await Promise.all([
            fetch(`${API_URL}/employees`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/departments`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/projects`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/dependents`, { headers }).then(r => r.json())
        ]);
        
        document.getElementById('totalEmployees').textContent = employees.count || 0;
        document.getElementById('totalDepartments').textContent = departments.count || 0;
        document.getElementById('totalProjects').textContent = projects.count || 0;
        document.getElementById('totalDependents').textContent = dependents.count || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// EMPLOYEES
async function loadEmployees() {
    const container = document.getElementById('employeesTable');
    container.innerHTML = '<div class="loading">Loading employees...</div>';
    
    try {
        const response = await fetch(`${API_URL}/employees`, { headers: getAuthHeaders() });
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Department</th>
                            <th>Salary</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.data.forEach(emp => {
                const photoHtml = emp.Photo 
                    ? `<img src="${emp.Photo}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" alt="${emp.Name}">` 
                    : '<div style="width: 40px; height: 40px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 18px;">👤</div>';
                
                html += `
                    <tr>
                        <td>${photoHtml}</td>
                        <td>${emp.Id}</td>
                        <td>${emp.Name}</td>
                        <td>${emp.Email || 'N/A'}</td>
                        <td>${emp.Phone || 'N/A'}</td>
                        <td>${emp.Department_Name || 'N/A'}</td>
                        <td>$${emp.Salary ? parseFloat(emp.Salary).toFixed(2) : '0.00'}</td>
                        <td>
                            <button class="btn btn-small btn-secondary" onclick="viewEmployee(${emp.Id})">View</button>
                            <button class="btn btn-small btn-danger" onclick="deleteEmployee(${emp.Id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No employees found.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Error loading employees</p>';
        console.error('Error:', error);
    }
}

async function searchEmployees() {
    const searchTerm = document.getElementById('employeeSearch').value;
    if (searchTerm.length < 2) {
        loadEmployees();
        return;
    }
    
    const container = document.getElementById('employeesTable');
    try {
        const response = await fetch(`${API_URL}/employees/search?q=${encodeURIComponent(searchTerm)}`, { headers: getAuthHeaders() });
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            let html = `<table><thead><tr><th>Photo</th><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Actions</th></tr></thead><tbody>`;
            data.data.forEach(emp => {
                const photoHtml = emp.Photo 
                    ? `<img src="${emp.Photo}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" alt="${emp.Name}">` 
                    : '<div style="width: 40px; height: 40px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 18px;">👤</div>';
                
                html += `
                    <tr>
                        <td>${photoHtml}</td>
                        <td>${emp.Id}</td>
                        <td>${emp.Name}</td>
                        <td>${emp.Email || 'N/A'}</td>
                        <td>${emp.Department_Name || 'N/A'}</td>
                        <td>
                            <button class="btn btn-small btn-secondary" onclick="viewEmployee(${emp.Id})">View</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No results found.</p>';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function showAddEmployeeModal() {
    document.getElementById('employeeModalTitle').textContent = 'Add New Employee';
    document.getElementById('employeeForm').reset();
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('employeeModal').classList.add('active');
}

// Photo handling functions
let currentPhotoData = null;

function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Photo size must be less than 5MB');
            event.target.value = '';
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            currentPhotoData = e.target.result;
            document.getElementById('photoPreviewImg').src = e.target.result;
            document.getElementById('photoPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function removePhoto() {
    currentPhotoData = null;
    document.getElementById('empPhoto').value = '';
    document.getElementById('photoPreview').style.display = 'none';
}

async function saveEmployee(event) {
    event.preventDefault();
    
    const employeeData = {
        Name: document.getElementById('empName').value,
        Gender: document.getElementById('empGender').value,
        Email: document.getElementById('empEmail').value || null,
        Phone: document.getElementById('empPhone').value || null,
        Address: document.getElementById('empAddress').value || null,
        Dob: document.getElementById('empDob').value || null,
        Doj: document.getElementById('empDoj').value || null,
        Department_No: document.getElementById('empDepartment').value || null,
        Since: document.getElementById('empDoj').value || null,
        Salary: document.getElementById('empSalary').value || null,
        Photo: currentPhotoData || null
    };
    
    try {
        const response = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(employeeData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('employeeModal');
            currentPhotoData = null;
            loadEmployees();
            loadDashboardStats();
            alert('Employee added successfully!');
        } else {
            alert('Error: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error saving employee');
        console.error('Error:', error);
    }
}

async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
        const response = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        const data = await response.json();
        
        if (data.success) {
            loadEmployees();
            loadDashboardStats();
            alert('Employee deleted successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error deleting employee');
        console.error('Error:', error);
    }
}

async function viewEmployee(id) {
    try {
        const response = await fetch(`${API_URL}/employees/${id}`, { headers: getAuthHeaders() });
        const data = await response.json();
        
        if (data.success) {
            const emp = data.data;
            alert(`Employee Details:\n\n` +
                  `ID: ${emp.Id}\n` +
                  `Name: ${emp.Name}\n` +
                  `Email: ${emp.Email || 'N/A'}\n` +
                  `Phone: ${emp.Phone || 'N/A'}\n` +
                  `Department: ${emp.Department_Name || 'N/A'}\n` +
                  `Salary: $${emp.Salary || '0'}\n` +
                  `DOB: ${emp.Dob || 'N/A'}\n` +
                  `Joining Date: ${emp.Doj || 'N/A'}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// DEPARTMENTS
async function loadDepartments() {
    const container = document.getElementById('departmentsTable');
    container.innerHTML = '<div class="loading">Loading departments...</div>';
    
    try {
        const response = await fetch(`${API_URL}/departments`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Dept No</th>
                            <th>Name</th>
                            <th>Location</th>
                            <th>Manager</th>
                            <th>Employees</th>
                            <th>Projects</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.data.forEach(dept => {
                html += `
                    <tr>
                        <td>${dept.D_No}</td>
                        <td>${dept.Name}</td>
                        <td>${dept.Location || 'N/A'}</td>
                        <td>${dept.Manager_Name || 'Not Assigned'}</td>
                        <td>${dept.Employee_Count}</td>
                        <td>${dept.Project_Count}</td>
                        <td>
                            <button class="btn btn-small btn-secondary" onclick="viewDepartment('${dept.D_No}')">View</button>
                            <button class="btn btn-small btn-danger" onclick="deleteDepartment('${dept.D_No}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No departments found.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Error loading departments</p>';
        console.error('Error:', error);
    }
}

async function viewDepartment(dNo) {
    try {
        const [deptRes, statsRes] = await Promise.all([
            fetch(`${API_URL}/departments/${dNo}`),
            fetch(`${API_URL}/departments/${dNo}/statistics`)
        ]);
        
        const deptData = await deptRes.json();
        const statsData = await statsRes.json();
        
        if (deptData.success) {
            const dept = deptData.data;
            const stats = statsData.data;
            alert(`Department Details:\n\n` +
                  `Number: ${dept.D_No}\n` +
                  `Name: ${dept.Name}\n` +
                  `Location: ${dept.Location || 'N/A'}\n` +
                  `Manager: ${dept.Manager_Name || 'Not Assigned'}\n` +
                  `Total Employees: ${stats.Total_Employees}\n` +
                  `Total Projects: ${stats.Total_Projects}\n` +
                  `Average Salary: $${parseFloat(stats.Average_Salary || 0).toFixed(2)}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteDepartment(dNo) {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
        const response = await fetch(`${API_URL}/departments/${dNo}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            loadDepartments();
            loadDashboardStats();
            alert('Department deleted successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error deleting department');
        console.error('Error:', error);
    }
}

function showAddDepartmentModal() {
    alert('Add Department functionality - Implement modal similar to employee');
}

async function deleteUserAccount(userId) {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (response.ok) {
            alert('User account deleted');
            loadPendingUsers();
        } else {
            alert('Error: ' + (data.error || 'Delete failed'));
        }
    } catch (error) {
        console.error('Error deleting user account:', error);
        alert('Failed to delete user account');
    }
}

// PROJECTS
async function loadProjects() {
    const container = document.getElementById('projectsTable');
    container.innerHTML = '<div class="loading">Loading projects...</div>';
    
    try {
        const response = await fetch(`${API_URL}/projects`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Project No</th>
                            <th>Name</th>
                            <th>Location</th>
                            <th>Department</th>
                            <th>Budget</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.data.forEach(proj => {
                const statusClass = proj.Status.toLowerCase().replace(' ', '-');
                html += `
                    <tr>
                        <td>${proj.P_No}</td>
                        <td>${proj.Name}</td>
                        <td>${proj.Location || 'N/A'}</td>
                        <td>${proj.Department_Name || 'N/A'}</td>
                        <td>$${parseFloat(proj.Budget || 0).toFixed(2)}</td>
                        <td><span class="badge badge-${statusClass}">${proj.Status}</span></td>
                        <td>
                            <button class="btn btn-small btn-secondary" onclick="viewProject('${proj.P_No}')">View</button>
                            <button class="btn btn-small btn-danger" onclick="deleteProject('${proj.P_No}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No projects found.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Error loading projects</p>';
        console.error('Error:', error);
    }
}

async function viewProject(pNo) {
    try {
        const [projRes, statsRes, empRes] = await Promise.all([
            fetch(`${API_URL}/projects/${pNo}`),
            fetch(`${API_URL}/projects/${pNo}/statistics`),
            fetch(`${API_URL}/projects/${pNo}/employees`)
        ]);
        
        const projData = await projRes.json();
        const statsData = await statsRes.json();
        const empData = await empRes.json();
        
        if (projData.success) {
            const proj = projData.data;
            const stats = statsData.data;
            alert(`Project Details:\n\n` +
                  `Number: ${proj.P_No}\n` +
                  `Name: ${proj.Name}\n` +
                  `Location: ${proj.Location || 'N/A'}\n` +
                  `Department: ${proj.Department_Name || 'N/A'}\n` +
                  `Budget: $${parseFloat(proj.Budget || 0).toFixed(2)}\n` +
                  `Status: ${proj.Status}\n` +
                  `Total Employees: ${stats.Total_Employees}\n` +
                  `Total Hours: ${parseFloat(stats.Total_Hours || 0).toFixed(2)}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteProject(pNo) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
        const response = await fetch(`${API_URL}/projects/${pNo}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            loadProjects();
            loadDashboardStats();
            alert('Project deleted successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error deleting project');
        console.error('Error:', error);
    }
}

function showAddProjectModal() {
    alert('Add Project functionality - Implement modal similar to employee');
}

// DEPENDENTS
async function loadDependents() {
    const container = document.getElementById('dependentsTable');
    container.innerHTML = '<div class="loading">Loading dependents...</div>';
    
    try {
        const response = await fetch(`${API_URL}/dependents`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Relationship</th>
                            <th>Employee</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.data.forEach(dep => {
                html += `
                    <tr>
                        <td>${dep.Id}</td>
                        <td>${dep.D_name}</td>
                        <td>${dep.Gender}</td>
                        <td>${dep.Relationship}</td>
                        <td>${dep.Employee_Name}</td>
                        <td>
                            <button class="btn btn-small btn-danger" onclick="deleteDependent(${dep.Id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No dependents found.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message">Error loading dependents</p>';
        console.error('Error:', error);
    }
}

async function deleteDependent(id) {
    if (!confirm('Are you sure you want to delete this dependent?')) return;
    
    try {
        const response = await fetch(`${API_URL}/dependents/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            loadDependents();
            loadDashboardStats();
            alert('Dependent deleted successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error deleting dependent');
        console.error('Error:', error);
    }
}

function showAddDependentModal() {
    alert('Add Dependent functionality - Implement modal similar to employee');
}

// Load department options for employee form
async function loadDepartmentOptions() {
    try {
        const response = await fetch(`${API_URL}/departments`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('empDepartment');
            data.data.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.D_No;
                option.textContent = dept.Name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

// Modal functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// USER MANAGEMENT (Admin Only)
async function loadPendingUsers() {
    const container = document.getElementById('pendingUsersTable');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: getAuthHeaders()
        });
        const users = await response.json();
        
        if (users.length > 0) {
            let html = `
                <h3>Employees</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            users.forEach(user => {
                html += `
                    <tr>
                        <td>${user.Username || ''}</td>
                        <td>${user.Email || ''}</td>
                        <td>${user.Role || 'Employee'}</td>
                        <td>${user.Status || 'Active'}</td>
                        <td>${new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-small btn-danger" onclick="deleteUserAccount(${user.Id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No employees found</p>';
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

async function approveUser(userId) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/approve`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('User approved successfully!');
            loadPendingUsers();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error approving user:', error);
        alert('Failed to approve user');
    }
}

async function rejectUser(userId) {
    if (!confirm('Are you sure you want to reject this user?')) return;
    
    try {
        const response = await fetch(`${API_URL}/users/${userId}/reject`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('User rejected');
            loadPendingUsers();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error rejecting user:', error);
        alert('Failed to reject user');
    }
}

function openCreateEmployeeModal() {
    document.getElementById('createEmployeeModal').classList.add('active');
    document.getElementById('generatedPasswordBox').style.display = 'none';
    document.getElementById('generatedPassword').textContent = '';
}

async function createEmployee() {
    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const role = document.getElementById('newRole').value;

    if (!username || !email) {
        alert('Username and email are required');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ username, email, role })
        });

        const data = await response.json();
        if (response.ok) {
            // Show generated password once
            document.getElementById('generatedPassword').textContent = data.generatedPassword;
            document.getElementById('generatedPasswordBox').style.display = 'block';
            // clear inputs
            document.getElementById('newUsername').value = '';
            document.getElementById('newEmail').value = '';
            // Reload user list
            setTimeout(() => { loadPendingUsers(); }, 1000);
        } else {
            alert('Error: ' + (data.error || 'Failed to create employee'));
        }
    } catch (error) {
        console.error('Error creating employee:', error);
        alert('Failed to create employee');
    }
}

