// API Configuration
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Global data storage
let allCompanies = [];
let allEmployees = [];
let allWorks = [];
let allManages = [];

// ==================== Authentication ====================

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return { token, user };
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// ==================== Initialize App ====================

document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    document.getElementById('username').textContent = auth.user.username;
    
    await loadDashboard();
    await loadCompanies();
    await loadEmployees();
    await loadWorks();
    await loadManages();
});

// ==================== Tab Switching ====================

function switchTab(tabName, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    btn.classList.add('active');

    // Refresh data when switching tabs
    switch(tabName) {
        case 'dashboard': loadDashboard(); break;
        case 'companies': loadCompanies(); break;
        case 'employees': loadEmployees(); break;
        case 'works': loadWorks(); break;
        case 'manages': loadManages(); break;
    }
}

// ==================== Dashboard ====================

async function loadDashboard() {
    try {
        const [companies, employees, works, stats] = await Promise.all([
            fetch(`${API_URL}/companies`, { headers: getAuthHeaders() }).then(r => r.json()),
            fetch(`${API_URL}/employees`, { headers: getAuthHeaders() }).then(r => r.json()),
            fetch(`${API_URL}/works`, { headers: getAuthHeaders() }).then(r => r.json()),
            fetch(`${API_URL}/works/stats`, { headers: getAuthHeaders() }).then(r => r.json())
        ]);

        document.getElementById('totalCompanies').textContent = companies.count || 0;
        document.getElementById('totalEmployees').textContent = employees.count || 0;
        document.getElementById('totalWorks').textContent = works.count || 0;

        // Calculate average salary
        if (stats.data && stats.data.length > 0) {
            const totalSalary = stats.data.reduce((sum, s) => sum + parseFloat(s.total_salary || 0), 0);
            const totalEmps = stats.data.reduce((sum, s) => sum + parseInt(s.employee_count || 0), 0);
            const avgSalary = totalEmps > 0 ? Math.round(totalSalary / totalEmps) : 0;
            document.getElementById('avgSalary').textContent = '$' + avgSalary.toLocaleString();

            // Display salary stats
            let statsHtml = '<h3 style="margin-bottom:15px;">Salary Statistics by Company</h3><table><thead><tr><th>Company</th><th>Employees</th><th>Min Salary</th><th>Max Salary</th><th>Avg Salary</th><th>Total</th></tr></thead><tbody>';
            stats.data.forEach(s => {
                statsHtml += `<tr>
                    <td>${s.company_name}</td>
                    <td>${s.employee_count}</td>
                    <td>$${parseInt(s.min_salary || 0).toLocaleString()}</td>
                    <td>$${parseInt(s.max_salary || 0).toLocaleString()}</td>
                    <td>$${Math.round(s.avg_salary || 0).toLocaleString()}</td>
                    <td>$${parseInt(s.total_salary || 0).toLocaleString()}</td>
                </tr>`;
            });
            statsHtml += '</tbody></table>';
            document.getElementById('salaryStats').innerHTML = statsHtml;
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ==================== Companies ====================

async function loadCompanies() {
    try {
        const response = await fetch(`${API_URL}/companies`, { headers: getAuthHeaders() });
        const data = await response.json();
        
        if (data.success) {
            allCompanies = data.data;
            renderCompanies(allCompanies);
        }
    } catch (error) {
        console.error('Error loading companies:', error);
    }
}

function renderCompanies(companies) {
    const tbody = document.getElementById('companiesTable');
    if (companies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No companies found</td></tr>';
        return;
    }

    tbody.innerHTML = companies.map(c => `
        <tr>
            <td>${c.company_name}</td>
            <td>${c.city}</td>
            <td>${c.employee_count || 0}</td>
            <td>$${c.avg_salary ? Math.round(c.avg_salary).toLocaleString() : '0'}</td>
            <td class="actions">
                <button class="btn btn-primary btn-small" onclick="editCompany('${c.company_name}')">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteCompany('${c.company_name}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function searchCompanies() {
    const search = document.getElementById('companySearch').value.toLowerCase();
    const filtered = allCompanies.filter(c => 
        c.company_name.toLowerCase().includes(search) || 
        c.city.toLowerCase().includes(search)
    );
    renderCompanies(filtered);
}

function openCompanyModal(company = null) {
    document.getElementById('companyModalTitle').textContent = company ? 'Edit Company' : 'Add Company';
    document.getElementById('companyOldName').value = company ? company.company_name : '';
    document.getElementById('companyName').value = company ? company.company_name : '';
    document.getElementById('companyCity').value = company ? company.city : '';
    document.getElementById('companyModal').classList.add('active');
}

async function editCompany(name) {
    const company = allCompanies.find(c => c.company_name === name);
    if (company) openCompanyModal(company);
}

async function saveCompany(event) {
    event.preventDefault();
    
    const oldName = document.getElementById('companyOldName').value;
    const data = {
        company_name: document.getElementById('companyName').value,
        city: document.getElementById('companyCity').value
    };

    try {
        const url = oldName ? `${API_URL}/companies/${encodeURIComponent(oldName)}` : `${API_URL}/companies`;
        const method = oldName ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('companiesMessage', 'Company saved successfully!', 'success');
            closeModal('companyModal');
            loadCompanies();
        } else {
            showMessage('companiesMessage', result.error || 'Error saving company', 'error');
        }
    } catch (error) {
        showMessage('companiesMessage', 'Error saving company', 'error');
    }
}

async function deleteCompany(name) {
    if (!confirm(`Delete company "${name}"? This will also delete all work relationships.`)) return;

    try {
        const response = await fetch(`${API_URL}/companies/${encodeURIComponent(name)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('companiesMessage', 'Company deleted successfully!', 'success');
            loadCompanies();
        } else {
            showMessage('companiesMessage', result.error || 'Error deleting company', 'error');
        }
    } catch (error) {
        showMessage('companiesMessage', 'Error deleting company', 'error');
    }
}

// ==================== Employees ====================

async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`, { headers: getAuthHeaders() });
        const data = await response.json();
        
        if (data.success) {
            allEmployees = data.data;
            renderEmployees(allEmployees);
            populateEmployeeDropdowns();
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

function renderEmployees(employees) {
    const tbody = document.getElementById('employeesTable');
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No employees found</td></tr>';
        return;
    }

    tbody.innerHTML = employees.map(e => `
        <tr>
            <td>${e.emp_id}</td>
            <td>${e.emp_name}</td>
            <td>${e.street_no || '-'}</td>
            <td>${e.city || '-'}</td>
            <td>${e.companies || '-'}</td>
            <td>$${e.total_salary ? parseInt(e.total_salary).toLocaleString() : '0'}</td>
            <td>${e.manager_name || '-'}</td>
            <td class="actions">
                <button class="btn btn-primary btn-small" onclick="editEmployee(${e.emp_id})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteEmployee(${e.emp_id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function searchEmployees() {
    const search = document.getElementById('employeeSearch').value.toLowerCase();
    const filtered = allEmployees.filter(e => 
        e.emp_name.toLowerCase().includes(search) || 
        (e.city && e.city.toLowerCase().includes(search)) ||
        String(e.emp_id).includes(search)
    );
    renderEmployees(filtered);
}

function populateEmployeeDropdowns() {
    const dropdowns = ['managerId', 'worksEmpId', 'managesEmpId', 'managesManagerId'];
    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const firstOption = select.options[0].outerHTML;
            select.innerHTML = firstOption + allEmployees.map(e => 
                `<option value="${e.emp_id}">${e.emp_name} (ID: ${e.emp_id})</option>`
            ).join('');
        }
    });
}

function openEmployeeModal(employee = null) {
    document.getElementById('employeeModalTitle').textContent = employee ? 'Edit Employee' : 'Add Employee';
    document.getElementById('employeeId').value = employee ? employee.emp_id : '';
    document.getElementById('empName').value = employee ? employee.emp_name : '';
    document.getElementById('streetNo').value = employee ? employee.street_no || '' : '';
    document.getElementById('empCity').value = employee ? employee.city || '' : '';
    document.getElementById('managerId').value = employee ? employee.manager_id || '' : '';
    document.getElementById('employeeModal').classList.add('active');
}

async function editEmployee(id) {
    try {
        const response = await fetch(`${API_URL}/employees/${id}`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (data.success) openEmployeeModal(data.data);
    } catch (error) {
        console.error('Error fetching employee:', error);
    }
}

async function saveEmployee(event) {
    event.preventDefault();
    
    const id = document.getElementById('employeeId').value;
    const data = {
        emp_name: document.getElementById('empName').value,
        street_no: document.getElementById('streetNo').value || null,
        city: document.getElementById('empCity').value || null,
        manager_id: document.getElementById('managerId').value || null
    };

    try {
        const url = id ? `${API_URL}/employees/${id}` : `${API_URL}/employees`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('employeesMessage', 'Employee saved successfully!', 'success');
            closeModal('employeeModal');
            loadEmployees();
            loadManages();
        } else {
            showMessage('employeesMessage', result.error || 'Error saving employee', 'error');
        }
    } catch (error) {
        showMessage('employeesMessage', 'Error saving employee', 'error');
    }
}

async function deleteEmployee(id) {
    if (!confirm('Delete this employee? This will also delete all related work and management relationships.')) return;

    try {
        const response = await fetch(`${API_URL}/employees/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('employeesMessage', 'Employee deleted successfully!', 'success');
            loadEmployees();
            loadWorks();
            loadManages();
        } else {
            showMessage('employeesMessage', result.error || 'Error deleting employee', 'error');
        }
    } catch (error) {
        showMessage('employeesMessage', 'Error deleting employee', 'error');
    }
}

// ==================== Works ====================

async function loadWorks() {
    try {
        const response = await fetch(`${API_URL}/works`, { headers: getAuthHeaders() });
        const data = await response.json();
        
        if (data.success) {
            allWorks = data.data;
            renderWorks(allWorks);
            populateCompanyDropdown();
        }
    } catch (error) {
        console.error('Error loading works:', error);
    }
}

function renderWorks(works) {
    const tbody = document.getElementById('worksTable');
    if (works.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No work relationships found</td></tr>';
        return;
    }

    tbody.innerHTML = works.map(w => `
        <tr>
            <td>${w.emp_id}</td>
            <td>${w.emp_name}</td>
            <td>${w.company_name}</td>
            <td>$${parseInt(w.salary || 0).toLocaleString()}</td>
            <td class="actions">
                <button class="btn btn-primary btn-small" onclick="editWorks(${w.emp_id}, '${w.company_name}')">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteWorks(${w.emp_id}, '${w.company_name}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function searchWorks() {
    const search = document.getElementById('worksSearch').value.toLowerCase();
    const filtered = allWorks.filter(w => 
        w.emp_name.toLowerCase().includes(search) || 
        w.company_name.toLowerCase().includes(search)
    );
    renderWorks(filtered);
}

function populateCompanyDropdown() {
    const select = document.getElementById('worksCompany');
    if (select) {
        const firstOption = select.options[0].outerHTML;
        select.innerHTML = firstOption + allCompanies.map(c => 
            `<option value="${c.company_name}">${c.company_name}</option>`
        ).join('');
    }
}

function openWorksModal(work = null) {
    document.getElementById('worksModalTitle').textContent = work ? 'Edit Work Relationship' : 'Add Work Relationship';
    document.getElementById('worksOldEmpId').value = work ? work.emp_id : '';
    document.getElementById('worksOldCompany').value = work ? work.company_name : '';
    document.getElementById('worksEmpId').value = work ? work.emp_id : '';
    document.getElementById('worksCompany').value = work ? work.company_name : '';
    document.getElementById('worksSalary').value = work ? work.salary : 0;
    
    // Disable employee and company selection when editing
    document.getElementById('worksEmpId').disabled = !!work;
    document.getElementById('worksCompany').disabled = !!work;
    
    document.getElementById('worksModal').classList.add('active');
}

async function editWorks(empId, companyName) {
    const work = allWorks.find(w => w.emp_id === empId && w.company_name === companyName);
    if (work) openWorksModal(work);
}

async function saveWorks(event) {
    event.preventDefault();
    
    const oldEmpId = document.getElementById('worksOldEmpId').value;
    const oldCompany = document.getElementById('worksOldCompany').value;
    const isEdit = oldEmpId && oldCompany;

    const data = {
        emp_id: parseInt(document.getElementById('worksEmpId').value),
        company_name: document.getElementById('worksCompany').value,
        salary: parseInt(document.getElementById('worksSalary').value) || 0
    };

    try {
        let url, method;
        if (isEdit) {
            url = `${API_URL}/works/${oldEmpId}/${encodeURIComponent(oldCompany)}`;
            method = 'PUT';
        } else {
            url = `${API_URL}/works`;
            method = 'POST';
        }
        
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('worksMessage', 'Work relationship saved successfully!', 'success');
            closeModal('worksModal');
            loadWorks();
            loadEmployees();
        } else {
            showMessage('worksMessage', result.error || 'Error saving work relationship', 'error');
        }
    } catch (error) {
        showMessage('worksMessage', 'Error saving work relationship', 'error');
    }
}

async function deleteWorks(empId, companyName) {
    if (!confirm(`Remove ${companyName} from employee ${empId}?`)) return;

    try {
        const response = await fetch(`${API_URL}/works/${empId}/${encodeURIComponent(companyName)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('worksMessage', 'Work relationship deleted successfully!', 'success');
            loadWorks();
            loadEmployees();
        } else {
            showMessage('worksMessage', result.error || 'Error deleting work relationship', 'error');
        }
    } catch (error) {
        showMessage('worksMessage', 'Error deleting work relationship', 'error');
    }
}

// ==================== Manages ====================

async function loadManages() {
    try {
        const response = await fetch(`${API_URL}/manages`, { headers: getAuthHeaders() });
        const data = await response.json();
        
        if (data.success) {
            allManages = data.data;
            renderManages(allManages);
        }
    } catch (error) {
        console.error('Error loading manages:', error);
    }
}

function renderManages(manages) {
    const tbody = document.getElementById('managesTable');
    if (manages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No management relationships found</td></tr>';
        return;
    }

    tbody.innerHTML = manages.map(m => `
        <tr>
            <td>${m.employee_name} (ID: ${m.emp_id})</td>
            <td>${m.employee_city || '-'}</td>
            <td>${m.manager_name} (ID: ${m.manager_id})</td>
            <td>${m.manager_city || '-'}</td>
            <td class="actions">
                <button class="btn btn-danger btn-small" onclick="deleteManages(${m.emp_id})">Remove</button>
            </td>
        </tr>
    `).join('');
}

function openManagesModal() {
    document.getElementById('managesEmpId').value = '';
    document.getElementById('managesManagerId').value = '';
    document.getElementById('managesModal').classList.add('active');
}

async function saveManages(event) {
    event.preventDefault();
    
    const empId = parseInt(document.getElementById('managesEmpId').value);
    const managerId = parseInt(document.getElementById('managesManagerId').value);

    if (empId === managerId) {
        showMessage('managesMessage', 'An employee cannot be their own manager', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/manages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ emp_id: empId, manager_id: managerId })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('managesMessage', 'Management relationship saved!', 'success');
            closeModal('managesModal');
            loadManages();
            loadEmployees();
        } else {
            showMessage('managesMessage', result.error || 'Error saving relationship', 'error');
        }
    } catch (error) {
        showMessage('managesMessage', 'Error saving relationship', 'error');
    }
}

async function deleteManages(empId) {
    if (!confirm('Remove this management relationship?')) return;

    try {
        const response = await fetch(`${API_URL}/manages/${empId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('managesMessage', 'Management relationship removed!', 'success');
            loadManages();
            loadEmployees();
        } else {
            showMessage('managesMessage', result.error || 'Error removing relationship', 'error');
        }
    } catch (error) {
        showMessage('managesMessage', 'Error removing relationship', 'error');
    }
}

// ==================== Utilities ====================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `message ${type}`;
    setTimeout(() => {
        el.className = 'message';
    }, 5000);
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

