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
    // allow optional branch or search via global inputs
    const container = document.getElementById('employeesTable');
    container.innerHTML = '<div class="loading">Loading employees...</div>';
    
    try {
        const branch = document.getElementById('branchFilter') ? document.getElementById('branchFilter').value : '';
        const search = document.getElementById('employeeSearch') ? document.getElementById('employeeSearch').value : '';
        let url = `${API_URL}/employees`;
        const params = [];
        if (branch) params.push(`branch=${encodeURIComponent(branch)}`);
        if (search && search.length >= 2) params.push(`q=${encodeURIComponent(search)}`);
        if (params.length) url += '?' + params.join('&');

        const response = await fetch(url, { headers: getAuthHeaders() });
        const data = await response.json();
        
        // support backend that returns an array or { success, data }
        const items = (data && data.data) ? data.data : (Array.isArray(data) ? data : []);
        if (items && items.length > 0) {
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
            
            items.forEach(emp => {
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
                            <button class="btn btn-small" onclick="showEditEmployee(${emp.Id})">Edit</button>
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
    // Use loadEmployees which already considers the search input
    loadEmployees();
}

function filterByBranch() {
    loadEmployees();
}

let editingEmployeeId = null;

function showAddEmployeeModal() {
    editingEmployeeId = null;
    document.getElementById('employeeModalTitle').textContent = 'Add New Employee';
    document.getElementById('employeeForm').reset();
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('employeeModal').classList.add('active');
}

async function showEditEmployee(id) {
    try {
        const response = await fetch(`${API_URL}/employees/${id}`, { headers: getAuthHeaders() });
        const data = await response.json();
        const emp = data.data || data; // handle different shapes

        if (!emp) {
            alert('Employee not found');
            return;
        }

        editingEmployeeId = id;
        document.getElementById('employeeModalTitle').textContent = 'Edit Employee';
        document.getElementById('empName').value = emp.Name || '';
        document.getElementById('empGender').value = emp.Gender || '';
        document.getElementById('empEmail').value = emp.Email || '';
        document.getElementById('empPhone').value = emp.Phone || '';
        document.getElementById('empAddress').value = emp.Address || '';
        if (emp.Dob) document.getElementById('empDob').value = emp.Dob.split('T')[0];
        if (emp.Doj) document.getElementById('empDoj').value = emp.Doj.split('T')[0];
        document.getElementById('empBranch').value = emp.Branch || '';
        document.getElementById('empDepartment').value = emp.Department_No || '';
        document.getElementById('empSalary').value = emp.Salary || '';

        // populate projects multi-select and select assigned ones
        try {
            const pResp = await fetch(`${API_URL}/employees/${id}/projects`, { headers: getAuthHeaders() });
            const pData = await pResp.json();
            const projects = (pData && pData.data) ? pData.data : [];
            await loadProjectOptions();
            // select assigned
            const select = document.getElementById('empProjects');
            Array.from(select.options).forEach(opt => { opt.selected = projects.some(p => String(p.P_No) === opt.value); });
        } catch (e) {
            console.error('Error loading employee projects:', e);
        }

        // populate dependents list
        try {
            const dResp = await fetch(`${API_URL}/employees/${id}/dependents`, { headers: getAuthHeaders() });
            const dData = await dResp.json();
            const deps = (dData && dData.data) ? dData.data : [];
            document.getElementById('dependentsList').innerHTML = '';
            deps.forEach(d => addDependentRow(d));
        } catch (e) {
            console.error('Error loading dependents:', e);
        }

        // photo preview
        if (emp.Photo) {
            currentPhotoData = emp.Photo;
            document.getElementById('photoPreviewImg').src = emp.Photo;
            document.getElementById('photoPreview').style.display = 'block';
        } else {
            currentPhotoData = null;
            document.getElementById('photoPreview').style.display = 'none';
        }

        document.getElementById('employeeModal').classList.add('active');
    } catch (error) {
        console.error('Error loading employee for edit:', error);
        alert('Failed to load employee');
    }
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

// Projects options loader
async function loadProjectOptions() {
    try {
        const response = await fetch(`${API_URL}/projects`, { headers: getAuthHeaders() });
        const data = await response.json();
        const select = document.getElementById('empProjects');
        if (!select) return;
        select.innerHTML = '';
        const projects = (data && data.data) ? data.data : [];
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.P_No;
            opt.textContent = `${p.Name} (${p.P_No})`;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Error loading projects:', e);
    }
}

// Dependents helper
function addDependentRow(dep) {
    const container = document.getElementById('dependentsList');
    if (!container) return;
    const idx = container.children.length;
    const row = document.createElement('div');
    row.className = 'dependent-row';
    row.innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <input type="text" class="dep-name" value="${dep && dep.D_name ? dep.D_name : ''}" />
        </div>
        <div class="form-group">
            <label>Gender</label>
            <select class="dep-gender">
                <option value="">Select</option>
                <option value="Male" ${dep && dep.Gender === 'Male' ? 'selected' : ''}>Male</option>
                <option value="Female" ${dep && dep.Gender === 'Female' ? 'selected' : ''}>Female</option>
                <option value="Other" ${dep && dep.Gender === 'Other' ? 'selected' : ''}>Other</option>
            </select>
        </div>
        <div class="form-group">
            <label>Relationship</label>
            <input type="text" class="dep-rel" value="${dep && dep.Relationship ? dep.Relationship : ''}" />
        </div>
        <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" class="dep-dob" value="${dep && dep.Date_of_Birth ? (dep.Date_of_Birth.split('T')[0]) : ''}" />
        </div>
        <button type="button" class="btn btn-small btn-danger" onclick="this.parentElement.remove()">Remove</button>
        <hr />
    `;
    container.appendChild(row);
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
        Branch: document.getElementById('empBranch').value || null,
        Since: document.getElementById('empDoj').value || null,
        Salary: document.getElementById('empSalary').value || null,
        Photo: currentPhotoData || null
    };

    // collect selected projects
    const projectSelect = document.getElementById('empProjects');
    if (projectSelect) {
        const selected = Array.from(projectSelect.selectedOptions).map(o => ({ projectNo: o.value }));
        if (selected.length) employeeData.projects = selected;
    }

    // collect dependents
    const depsContainer = document.getElementById('dependentsList');
    if (depsContainer) {
        const rows = Array.from(depsContainer.querySelectorAll('.dependent-row'));
        const dependents = rows.map(r => ({
            D_name: r.querySelector('.dep-name').value,
            Gender: r.querySelector('.dep-gender').value,
            Relationship: r.querySelector('.dep-rel').value,
            Date_of_Birth: r.querySelector('.dep-dob').value || null
        })).filter(d => d.D_name && d.Gender);
        if (dependents.length) employeeData.dependents = dependents;
    }
    
    try {
        let response;
        if (editingEmployeeId) {
            // update existing user via admin users endpoint
            response = await fetch(`${API_URL}/users/${editingEmployeeId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(employeeData)
            });
        } else {
            response = await fetch(`${API_URL}/employees`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(employeeData)
            });
        }
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('employeeModal');
            currentPhotoData = null;
            editingEmployeeId = null;
            loadEmployees();
            loadDashboardStats();
            alert(editingEmployeeId ? 'Employee updated successfully!' : 'Employee added successfully!');
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
        
        if (response.ok) {
            loadEmployees();
            loadDashboardStats();
            alert('Employee deleted successfully!');
        } else {
            alert('Error: ' + (data && data.error ? data.error : 'Failed to delete'));
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
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // If modal was dynamically created, remove it entirely and clean up handlers
    if (modal.dataset && modal.dataset.dynamic === 'true') {
        if (modal._escHandler) document.removeEventListener('keydown', modal._escHandler);
        modal.remove();
        return;
    }

    modal.classList.remove('active');
}

// Close modal when clicking outside for statically rendered modals
window.onclick = function(event) {
    if (event.target.classList && event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Allow Esc to close statically rendered modals as well
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const staticModal = document.querySelector('.modal:not([data-dynamic="true"])');
        if (staticModal) {
            staticModal.classList.remove('active');
        }
    }
});

// Admin user list removed — using single employees dashboard
// (Pending user approval UI removed to simplify the admin interface.)

function openCreateEmployeeModal() {
    // Prevent multiple instances
    if (document.getElementById('createEmployeeModal')) return;

    const modal = document.createElement('div');
    modal.id = 'createEmployeeModal';
    modal.className = 'modal admin-only active';
    modal.dataset.dynamic = 'true';

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create Employee</h3>
          <button class="close-btn" onclick="closeModal('createEmployeeModal')">✕</button>
        </div>
        <div class="modal-body">
          <div id="createEmployeeError" class="error-message" style="display:none;"></div>
          <div class="form-group">
            <label>Username</label>
            <input type="text" id="newUsername" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="newEmail" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select id="newRole">
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div id="generatedPasswordBox" style="display:none; margin-top:10px;">
            <div class="success-message">Generated password (copy now, will not be shown again): <strong id="generatedPassword"></strong></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('createEmployeeModal')">Cancel</button>
          <button id="createEmployeeBtn" class="btn" onclick="createEmployee()">Create Employee</button>
        </div>
      </div>
    `;

    // Close when clicking backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal('createEmployeeModal');
    });

    // Esc key handler
    const escHandler = (e) => { if (e.key === 'Escape') closeModal('createEmployeeModal'); };
    // attach handler reference so we can remove it later
    modal._escHandler = escHandler;
    document.addEventListener('keydown', escHandler);

    document.body.appendChild(modal);

    // Ensure form state is clean
    const generatedBox = document.getElementById('generatedPasswordBox');
    if (generatedBox) generatedBox.style.display = 'none';
    const generated = document.getElementById('generatedPassword');
    if (generated) generated.textContent = '';
}

async function createEmployee() {
    const usernameEl = document.getElementById('newUsername');
    const emailEl = document.getElementById('newEmail');
    const roleEl = document.getElementById('newRole');
    const errorBox = document.getElementById('createEmployeeError');
    const createBtn = document.getElementById('createEmployeeBtn');

    const username = usernameEl.value.trim();
    const email = emailEl.value.trim();
    const role = roleEl.value;

    // simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    errorBox.style.display = 'none';
    errorBox.textContent = '';

    if (!username || !email) {
        errorBox.style.display = 'block';
        errorBox.textContent = 'Username and email are required';
        return;
    }
    if (!emailRegex.test(email)) {
        errorBox.style.display = 'block';
        errorBox.textContent = 'Please enter a valid email address';
        return;
    }

    try {
        createBtn.disabled = true;
        createBtn.textContent = 'Creating...';

        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ username, email, role })
        });

        let data = null;
        try { data = await response.json(); } catch (e) { data = null; }

        if (response.status === 201 && data && data.generatedPassword) {
            document.getElementById('generatedPassword').textContent = data.generatedPassword;
            document.getElementById('generatedPasswordBox').style.display = 'block';
            // add copy button and done button
            const generatedBox = document.getElementById('generatedPasswordBox');
            if (!document.getElementById('copyGeneratedPassword')) {
                const copyBtn = document.createElement('button');
                copyBtn.id = 'copyGeneratedPassword';
                copyBtn.className = 'btn';
                copyBtn.style.marginLeft = '10px';
                copyBtn.textContent = 'Copy';
                copyBtn.onclick = async () => {
                    try {
                        await navigator.clipboard.writeText(data.generatedPassword);
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
                    } catch (e) {
                        console.error('Clipboard error:', e);
                        alert('Unable to copy to clipboard');
                    }
                };
                generatedBox.appendChild(copyBtn);
            }
            if (!document.getElementById('doneGeneratedPassword')) {
                const doneBtn = document.createElement('button');
                doneBtn.id = 'doneGeneratedPassword';
                doneBtn.className = 'btn btn-secondary';
                doneBtn.style.marginLeft = '10px';
                doneBtn.textContent = 'Done';
                doneBtn.onclick = () => { closeModal('createEmployeeModal'); loadEmployees(); };
                generatedBox.appendChild(doneBtn);
            }
            // clear inputs
            usernameEl.value = '';
            emailEl.value = '';
            // reload user list in background (ensure new user appears)
            setTimeout(() => { loadEmployees(); }, 1000);
        } else if (response.status === 400) {
            errorBox.style.display = 'block';
            errorBox.textContent = (data && data.error) || 'Invalid input';
        } else if (response.status === 401 || response.status === 403) {
            errorBox.style.display = 'block';
            errorBox.textContent = (data && data.error) || 'Authentication required';
        } else if (response.status >= 500) {
            errorBox.style.display = 'block';
            errorBox.textContent = (data && data.error) || 'Server error. Try again later.';
            console.error('Create employee server error:', response.status, data);
        } else {
            errorBox.style.display = 'block';
            errorBox.textContent = (data && data.error) || 'Failed to create employee';
        }
    } catch (error) {
        console.error('Error creating employee:', error);
        errorBox.style.display = 'block';
        errorBox.textContent = 'Network or server error. Check console for details.';
    } finally {
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.textContent = 'Create Employee';
        }
    }
}

