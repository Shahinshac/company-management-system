// 26:07 Company Management System - Enhanced Frontend
const API_URL = window.location.origin + '/api';
let token = localStorage.getItem('token');
let allCompanies = [];
let allEmployees = [];
let allWorks = [];
let allManages = [];
let settings = {};

// Check authentication
function checkAuth() {
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// API helper
async function api(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return;
    }
    return response.json();
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Format currency
function formatCurrency(amount) {
    const curr = settings.currency || 'USD';
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    return `${symbols[curr] || '$'}${Number(amount || 0).toLocaleString()}`;
}

// Page navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    event?.target?.classList.add('active') || document.querySelector(`[onclick="showPage('${pageId}')"]`).classList.add('active');
    
    const titles = {
        dashboard: 'Dashboard',
        companies: 'Companies',
        employees: 'Employees',
        works: 'Work Assignments',
        manages: 'Management',
        reports: 'Reports & Analytics',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[pageId] || pageId;
    
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'companies') loadCompanies();
    if (pageId === 'employees') loadEmployees();
    if (pageId === 'works') loadWorks();
    if (pageId === 'manages') loadManages();
    if (pageId === 'reports') loadReports();
    if (pageId === 'settings') loadSettings();
}

// Modal handling
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// ===================== DASHBOARD =====================
async function loadDashboard() {
    try {
        const [companiesRes, employeesRes, worksRes, reportsRes] = await Promise.all([
            api('/companies'),
            api('/employees'),
            api('/works'),
            api('/reports/stats')
        ]);
        
        allCompanies = companiesRes.data || [];
        allEmployees = employeesRes.data || [];
        allWorks = worksRes.data || [];
        
        const stats = reportsRes.data || {};
        
        document.getElementById('statCompanies').textContent = stats.total_companies || allCompanies.length;
        document.getElementById('statEmployees').textContent = stats.total_employees || allEmployees.length;
        document.getElementById('statPayroll').textContent = formatCurrency(stats.total_payroll || 0);
        document.getElementById('statAvgSalary').textContent = formatCurrency(stats.avg_salary || 0);
        
        // Load company chart
        loadCompanyChart();
        
        // Load top earners
        loadTopEarners();
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

async function loadCompanyChart() {
    try {
        const res = await api('/reports/salary-by-company');
        const data = res.data || [];
        const maxSalary = Math.max(...data.map(d => d.total_salary || 0), 1);
        
        const html = data.slice(0, 5).map(item => `
            <div class="bar-item">
                <span class="bar-label">${item.company_name || 'Unknown'}</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${(item.total_salary / maxSalary) * 100}%"></div>
                </div>
                <span class="bar-value">${formatCurrency(item.total_salary)}</span>
            </div>
        `).join('') || '<p style="color:#666;padding:20px">No data available</p>';
        
        document.getElementById('companyChart').innerHTML = html;
    } catch (error) {
        console.error('Chart error:', error);
    }
}

async function loadTopEarners() {
    try {
        const res = await api('/reports/top-earners?limit=5');
        const data = res.data || [];
        
        const html = data.map(emp => `
            <tr>
                <td><strong>${emp.emp_name || 'Unknown'}</strong></td>
                <td>${emp.city || '-'}</td>
                <td>${emp.company_count || 0}</td>
                <td><strong>${formatCurrency(emp.total_salary)}</strong></td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="empty-state">No employees found</td></tr>';
        
        document.getElementById('topEarnersTable').innerHTML = html;
    } catch (error) {
        console.error('Top earners error:', error);
    }
}

// ===================== COMPANIES =====================
async function loadCompanies() {
    try {
        const res = await api('/companies');
        allCompanies = res.data || [];
        renderCompanies(allCompanies);
    } catch (error) {
        showToast('Error loading companies', 'error');
    }
}

function renderCompanies(companies) {
    const html = companies.map(c => `
        <tr>
            <td><strong>${c.company_name}</strong></td>
            <td>${c.city || '-'}</td>
            <td>${c.employee_count || 0}</td>
            <td>${formatCurrency(c.total_salary)}</td>
            <td>${formatCurrency(c.avg_salary)}</td>
            <td class="actions">
                <button class="btn btn-small btn-secondary" onclick="editCompany('${c.company_name}', '${c.city}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteCompany('${c.company_name}')">Delete</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="empty-state"><span>🏢</span><p>No companies found</p></td></tr>';
    
    document.getElementById('companiesTable').innerHTML = html;
}

function searchCompanies() {
    const search = document.getElementById('companySearch').value.toLowerCase();
    const filtered = allCompanies.filter(c => 
        c.company_name.toLowerCase().includes(search) || 
        (c.city && c.city.toLowerCase().includes(search))
    );
    renderCompanies(filtered);
}

function openCompanyModal(name = '', city = '') {
    document.getElementById('companyModalTitle').textContent = name ? 'Edit Company' : 'Add Company';
    document.getElementById('companyOldName').value = name;
    document.getElementById('companyName').value = name;
    document.getElementById('companyCity').value = city;
    openModal('companyModal');
}

function editCompany(name, city) {
    openCompanyModal(name, city);
}

async function saveCompany(e) {
    e.preventDefault();
    const oldName = document.getElementById('companyOldName').value;
    const data = {
        company_name: document.getElementById('companyName').value,
        city: document.getElementById('companyCity').value
    };
    
    try {
        if (oldName) {
            await api(`/companies/${encodeURIComponent(oldName)}`, 'PUT', data);
            showToast('Company updated successfully');
        } else {
            await api('/companies', 'POST', data);
            showToast('Company created successfully');
        }
        closeModal('companyModal');
        loadCompanies();
    } catch (error) {
        showToast('Error saving company', 'error');
    }
}

async function deleteCompany(name) {
    if (!confirm(`Delete company "${name}"?`)) return;
    
    try {
        await api(`/companies/${encodeURIComponent(name)}`, 'DELETE');
        showToast('Company deleted');
        loadCompanies();
    } catch (error) {
        showToast('Error deleting company', 'error');
    }
}

// ===================== EMPLOYEES =====================
async function loadEmployees() {
    try {
        const res = await api('/employees');
        allEmployees = res.data || [];
        renderEmployees(allEmployees);
        populateManagerDropdowns();
    } catch (error) {
        showToast('Error loading employees', 'error');
    }
}

function renderEmployees(employees) {
    const html = employees.map(e => `
        <tr>
            <td>${e.emp_id}</td>
            <td><strong>${e.emp_name}</strong></td>
            <td>${e.street_no || '-'}</td>
            <td>${e.city || '-'}</td>
            <td>${e.company_count || 0}</td>
            <td>${formatCurrency(e.total_salary)}</td>
            <td>${e.manager_name || '<span style="color:#999">None</span>'}</td>
            <td class="actions">
                <button class="btn btn-small btn-secondary" onclick="editEmployee(${JSON.stringify(e).replace(/"/g, '&quot;')})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteEmployee(${e.emp_id})">Delete</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="8" class="empty-state"><span>👥</span><p>No employees found</p></td></tr>';
    
    document.getElementById('employeesTable').innerHTML = html;
}

function searchEmployees() {
    const search = document.getElementById('employeeSearch').value.toLowerCase();
    const filtered = allEmployees.filter(e => 
        e.emp_name.toLowerCase().includes(search) || 
        (e.city && e.city.toLowerCase().includes(search))
    );
    renderEmployees(filtered);
}

function populateManagerDropdowns() {
    const options = '<option value="">-- No Manager --</option>' + 
        allEmployees.map(e => `<option value="${e.emp_id}">${e.emp_name}</option>`).join('');
    
    document.getElementById('managerId').innerHTML = options;
    document.getElementById('managesManagerId').innerHTML = options.replace('-- No Manager --', '-- Select Manager --');
    document.getElementById('managesEmpId').innerHTML = options.replace('-- No Manager --', '-- Select Employee --');
    
    // Works dropdowns
    const empOptions = '<option value="">-- Select Employee --</option>' + 
        allEmployees.map(e => `<option value="${e.emp_id}">${e.emp_name}</option>`).join('');
    document.getElementById('worksEmpId').innerHTML = empOptions;
}

function openEmployeeModal() {
    document.getElementById('employeeModalTitle').textContent = 'Add Employee';
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    openModal('employeeModal');
}

function editEmployee(emp) {
    document.getElementById('employeeModalTitle').textContent = 'Edit Employee';
    document.getElementById('employeeId').value = emp.emp_id;
    document.getElementById('empName').value = emp.emp_name;
    document.getElementById('streetNo').value = emp.street_no || '';
    document.getElementById('empCity').value = emp.city || '';
    document.getElementById('managerId').value = emp.manager_id || '';
    openModal('employeeModal');
}

async function saveEmployee(e) {
    e.preventDefault();
    const empId = document.getElementById('employeeId').value;
    const managerId = document.getElementById('managerId').value;
    
    const data = {
        emp_name: document.getElementById('empName').value,
        street_no: document.getElementById('streetNo').value || null,
        city: document.getElementById('empCity').value || null,
        manager_id: managerId || null
    };
    
    try {
        if (empId) {
            await api(`/employees/${empId}`, 'PUT', data);
            showToast('Employee updated successfully');
        } else {
            await api('/employees', 'POST', data);
            showToast('Employee created successfully');
        }
        closeModal('employeeModal');
        loadEmployees();
    } catch (error) {
        showToast('Error saving employee', 'error');
    }
}

async function deleteEmployee(id) {
    if (!confirm('Delete this employee?')) return;
    
    try {
        await api(`/employees/${id}`, 'DELETE');
        showToast('Employee deleted');
        loadEmployees();
    } catch (error) {
        showToast('Error deleting employee', 'error');
    }
}

// ===================== WORKS =====================
async function loadWorks() {
    try {
        const [worksRes, companiesRes] = await Promise.all([
            api('/works'),
            api('/companies')
        ]);
        allWorks = worksRes.data || [];
        allCompanies = companiesRes.data || [];
        renderWorks(allWorks);
        populateCompanyDropdown();
    } catch (error) {
        showToast('Error loading work assignments', 'error');
    }
}

function renderWorks(works) {
    const html = works.map(w => `
        <tr>
            <td><strong>${w.emp_name || `Employee #${w.emp_id}`}</strong></td>
            <td>${w.company_name}</td>
            <td>${formatCurrency(w.salary)}</td>
            <td class="actions">
                <button class="btn btn-small btn-secondary" onclick="editWorks(${w.emp_id}, '${w.company_name}', ${w.salary})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteWorks(${w.emp_id}, '${w.company_name}')">Remove</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="4" class="empty-state"><span>💼</span><p>No work assignments</p></td></tr>';
    
    document.getElementById('worksTable').innerHTML = html;
}

function searchWorks() {
    const search = document.getElementById('worksSearch').value.toLowerCase();
    const filtered = allWorks.filter(w => 
        (w.emp_name && w.emp_name.toLowerCase().includes(search)) ||
        w.company_name.toLowerCase().includes(search)
    );
    renderWorks(filtered);
}

function populateCompanyDropdown() {
    const options = '<option value="">-- Select Company --</option>' + 
        allCompanies.map(c => `<option value="${c.company_name}">${c.company_name}</option>`).join('');
    document.getElementById('worksCompany').innerHTML = options;
}

function openWorksModal() {
    document.getElementById('worksModalTitle').textContent = 'Assign Employee to Company';
    document.getElementById('worksForm').reset();
    document.getElementById('worksOldEmpId').value = '';
    document.getElementById('worksOldCompany').value = '';
    document.getElementById('worksSalary').value = '0';
    loadEmployees().then(() => {
        openModal('worksModal');
    });
}

function editWorks(empId, company, salary) {
    document.getElementById('worksModalTitle').textContent = 'Edit Assignment';
    document.getElementById('worksOldEmpId').value = empId;
    document.getElementById('worksOldCompany').value = company;
    document.getElementById('worksEmpId').value = empId;
    document.getElementById('worksCompany').value = company;
    document.getElementById('worksSalary').value = salary;
    openModal('worksModal');
}

async function saveWorks(e) {
    e.preventDefault();
    const oldEmpId = document.getElementById('worksOldEmpId').value;
    const oldCompany = document.getElementById('worksOldCompany').value;
    
    const data = {
        emp_id: document.getElementById('worksEmpId').value,
        company_name: document.getElementById('worksCompany').value,
        salary: document.getElementById('worksSalary').value || 0
    };
    
    try {
        if (oldEmpId && oldCompany) {
            await api(`/works/${oldEmpId}/${encodeURIComponent(oldCompany)}`, 'PUT', data);
            showToast('Assignment updated');
        } else {
            await api('/works', 'POST', data);
            showToast('Employee assigned to company');
        }
        closeModal('worksModal');
        loadWorks();
    } catch (error) {
        showToast('Error saving assignment', 'error');
    }
}

async function deleteWorks(empId, company) {
    if (!confirm('Remove this work assignment?')) return;
    
    try {
        await api(`/works/${empId}/${encodeURIComponent(company)}`, 'DELETE');
        showToast('Assignment removed');
        loadWorks();
    } catch (error) {
        showToast('Error removing assignment', 'error');
    }
}

// ===================== MANAGES =====================
async function loadManages() {
    try {
        const res = await api('/manages');
        allManages = res.data || [];
        renderManages(allManages);
        loadEmployees();
    } catch (error) {
        showToast('Error loading management data', 'error');
    }
}

function renderManages(manages) {
    const html = manages.map(m => `
        <tr>
            <td><strong>${m.emp_name || `Employee #${m.emp_id}`}</strong></td>
            <td>${m.emp_city || '-'}</td>
            <td><strong>${m.manager_name || `Manager #${m.manager_id}`}</strong></td>
            <td>${m.manager_city || '-'}</td>
            <td class="actions">
                <button class="btn btn-small btn-danger" onclick="deleteManages(${m.emp_id})">Remove</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="empty-state"><span>👔</span><p>No management relationships</p></td></tr>';
    
    document.getElementById('managesTable').innerHTML = html;
}

function openManagesModal() {
    document.getElementById('managesForm').reset();
    openModal('managesModal');
}

async function saveManages(e) {
    e.preventDefault();
    const empId = document.getElementById('managesEmpId').value;
    const managerId = document.getElementById('managesManagerId').value;
    
    if (empId === managerId) {
        showToast('Employee cannot manage themselves', 'error');
        return;
    }
    
    try {
        await api('/manages', 'POST', { emp_id: empId, manager_id: managerId });
        showToast('Manager assigned');
        closeModal('managesModal');
        loadManages();
    } catch (error) {
        showToast('Error assigning manager', 'error');
    }
}

async function deleteManages(empId) {
    if (!confirm('Remove this management relationship?')) return;
    
    try {
        await api(`/manages/${empId}`, 'DELETE');
        showToast('Management relationship removed');
        loadManages();
    } catch (error) {
        showToast('Error removing relationship', 'error');
    }
}

// ===================== REPORTS =====================
async function loadReports() {
    try {
        const [byCompany, byCity, topManagers, unassigned, empty] = await Promise.all([
            api('/reports/salary-by-company'),
            api('/reports/salary-by-city'),
            api('/reports/top-managers'),
            api('/reports/unassigned-employees'),
            api('/reports/empty-companies')
        ]);
        
        // Salary by company
        const companyHtml = (byCompany.data || []).map(c => `
            <div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee">
                <span>${c.company_name}</span>
                <strong>${formatCurrency(c.total_salary)}</strong>
            </div>
        `).join('') || '<p style="color:#666">No data</p>';
        document.getElementById('salaryByCompanyReport').innerHTML = companyHtml;
        
        // Salary by city
        const cityHtml = (byCity.data || []).map(c => `
            <div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee">
                <span>${c.city || 'Unknown'}</span>
                <strong>${formatCurrency(c.total_salary)}</strong>
            </div>
        `).join('') || '<p style="color:#666">No data</p>';
        document.getElementById('salaryByCityReport').innerHTML = cityHtml;
        
        // Top managers
        const managersHtml = (topManagers.data || []).map(m => `
            <tr>
                <td><strong>${m.manager_name}</strong></td>
                <td>${m.city || '-'}</td>
                <td>${m.subordinate_count}</td>
                <td>${m.subordinates || '-'}</td>
            </tr>
        `).join('') || '<tr><td colspan="4">No managers found</td></tr>';
        document.getElementById('topManagersTable').innerHTML = managersHtml;
        
        // Unassigned employees
        const unassignedHtml = (unassigned.data || []).length > 0 ? 
            unassigned.data.map(e => `<div class="badge badge-warning" style="margin:5px">${e.emp_name}</div>`).join('') :
            '<p style="color:#10b981">✓ All employees are assigned</p>';
        document.getElementById('unassignedReport').innerHTML = unassignedHtml;
        
        // Empty companies
        const emptyHtml = (empty.data || []).length > 0 ?
            empty.data.map(c => `<div class="badge badge-danger" style="margin:5px">${c.company_name}</div>`).join('') :
            '<p style="color:#10b981">✓ All companies have employees</p>';
        document.getElementById('emptyCompaniesReport').innerHTML = emptyHtml;
        
    } catch (error) {
        console.error('Reports error:', error);
    }
}

function exportReport(type) {
    showToast('Export feature coming soon!');
}

// ===================== SETTINGS =====================
async function loadSettings() {
    try {
        const res = await api('/settings');
        settings = res.data || {};
        
        document.getElementById('settingCompanyName').value = settings.company_name || '26:07';
        document.getElementById('settingTagline').value = settings.tagline || 'Company Management';
        document.getElementById('settingCurrency').value = settings.currency || 'USD';
        document.getElementById('settingDateFormat').value = settings.date_format || 'YYYY-MM-DD';
    } catch (error) {
        console.error('Settings error:', error);
    }
}

async function saveSettings(e) {
    e.preventDefault();
    
    const data = {
        company_name: document.getElementById('settingCompanyName').value,
        tagline: document.getElementById('settingTagline').value,
        currency: document.getElementById('settingCurrency').value,
        date_format: document.getElementById('settingDateFormat').value
    };
    
    try {
        await api('/settings', 'PUT', data);
        settings = data;
        document.getElementById('companyTagline').textContent = data.tagline;
        showToast('Settings saved successfully');
    } catch (error) {
        showToast('Error saving settings', 'error');
    }
}

async function changePassword(e) {
    e.preventDefault();
    
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    if (newPass !== confirmPass) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    try {
        await api('/auth/change-password', 'POST', {
            currentPassword: document.getElementById('currentPassword').value,
            newPassword: newPass
        });
        showToast('Password changed successfully');
        document.getElementById('passwordForm').reset();
    } catch (error) {
        showToast('Error changing password', 'error');
    }
}

// ===================== INITIALIZATION =====================
async function init() {
    if (!checkAuth()) return;
    
    // Get user info
    try {
        const res = await api('/auth/me');
        if (res.user) {
            document.getElementById('displayUsername').textContent = res.user.username;
            document.getElementById('userAvatar').textContent = res.user.username.charAt(0).toUpperCase();
            document.getElementById('userRole').textContent = res.user.role === 'admin' ? 'Administrator' : 'User';
        }
    } catch (error) {
        console.error('User info error:', error);
    }
    
    // Load settings
    try {
        const res = await api('/settings');
        settings = res.data || {};
        if (settings.tagline) {
            document.getElementById('companyTagline').textContent = settings.tagline;
        }
    } catch (error) {
        console.error('Settings error:', error);
    }
    
    // Load dashboard
    loadDashboard();
}

// Start the app
init();

