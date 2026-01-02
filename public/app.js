// 26:07 Company Management System - Enhanced Frontend
const API_URL = window.location.origin + '/api';
let token = localStorage.getItem('token');
let currentUser = null;
let allCompanies = [];
let allEmployees = [];
let allDependents = [];
let allWorks = [];
let allManages = [];
let settings = {};
let employeeViewMode = 'grid';

// ===================== AUTHENTICATION =====================
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
    if (data) options.body = JSON.stringify(data);
    
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

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const format = settings.date_format || 'YYYY-MM-DD';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
    if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
    return `${year}-${month}-${day}`;
}

// Get initials from name
function getInitials(name) {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
}

// Logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// ===================== PAGE NAVIGATION =====================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    document.querySelector(`[onclick="showPage('${pageId}')"]`)?.classList.add('active');
    
    const titles = {
        dashboard: 'Dashboard',
        companies: 'Companies',
        employees: 'Employees',
        dependents: 'Dependents',
        works: 'Work Assignments',
        manages: 'Management',
        reports: 'Reports & Analytics',
        users: 'User Management',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[pageId] || pageId;
    
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'companies') loadCompanies();
    if (pageId === 'employees') loadEmployees();
    if (pageId === 'dependents') loadDependents();
    if (pageId === 'works') loadWorks();
    if (pageId === 'manages') loadManages();
    if (pageId === 'reports') loadReports();
    if (pageId === 'users') loadUsers();
    if (pageId === 'settings') loadSettings();
}

// Modal handling
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// ===================== DASHBOARD =====================
async function loadDashboard() {
    try {
        const [companiesRes, employeesRes, worksRes, dependentsRes] = await Promise.all([
            api('/companies'),
            api('/employees'),
            api('/works'),
            api('/dependents')
        ]);
        
        allCompanies = companiesRes.data || [];
        allEmployees = employeesRes.data || [];
        allWorks = worksRes.data || [];
        allDependents = dependentsRes.data || [];
        
        const totalPayroll = allWorks.reduce((sum, w) => sum + (w.salary || 0), 0);
        
        document.getElementById('statCompanies').textContent = allCompanies.length;
        document.getElementById('statEmployees').textContent = allEmployees.length;
        document.getElementById('statPayroll').textContent = formatCurrency(totalPayroll);
        document.getElementById('statDependents').textContent = allDependents.length;
        
        // Recent employees with photos
        const recentHtml = allEmployees.slice(0, 6).map(e => `
            <div class="employee-card">
                <div class="employee-card-header">
                    <div class="employee-photo">
                        ${e.photo_url ? `<img src="${e.photo_url}" alt="${e.emp_name}" onerror="this.parentElement.innerHTML='${getInitials(e.emp_name)}'">` : getInitials(e.emp_name)}
                    </div>
                    <div class="employee-info">
                        <h3>${e.emp_name}</h3>
                        <p>${e.job_title || 'Employee'}</p>
                    </div>
                </div>
                <div class="employee-details">
                    <p>📧 ${e.email || 'No email'}</p>
                    <p>📍 ${e.city || 'No location'}</p>
                </div>
            </div>
        `).join('') || '<div class="empty-state"><span>👥</span><p>No employees yet</p></div>';
        
        document.getElementById('recentEmployees').innerHTML = recentHtml;
    } catch (error) {
        console.error('Dashboard error:', error);
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
            <td><strong>${c.company_name}</strong>${c.industry ? `<br><small style="color:#666">${c.industry}</small>` : ''}</td>
            <td>${c.city || '-'}</td>
            <td>${c.industry || '-'}</td>
            <td>${c.employee_count || 0}</td>
            <td>${formatCurrency(c.total_salary || 0)}</td>
            <td class="actions">
                <button class="btn btn-small btn-secondary" onclick='editCompany(${JSON.stringify(c).replace(/'/g, "\\'")})'>Edit</button>
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
        (c.city && c.city.toLowerCase().includes(search)) ||
        (c.industry && c.industry.toLowerCase().includes(search))
    );
    renderCompanies(filtered);
}

function openCompanyModal() {
    document.getElementById('companyModalTitle').textContent = 'Add Company';
    document.getElementById('companyForm').reset();
    document.getElementById('companyOldName').value = '';
    openModal('companyModal');
}

function editCompany(c) {
    document.getElementById('companyModalTitle').textContent = 'Edit Company';
    document.getElementById('companyOldName').value = c.company_name;
    document.getElementById('companyName').value = c.company_name || '';
    document.getElementById('companyCity').value = c.city || '';
    document.getElementById('companyIndustry').value = c.industry || '';
    document.getElementById('companyFoundedYear').value = c.founded_year || '';
    document.getElementById('companyPhone').value = c.phone || '';
    document.getElementById('companyEmail').value = c.email || '';
    document.getElementById('companyAddress').value = c.address || '';
    openModal('companyModal');
}

async function saveCompany(e) {
    e.preventDefault();
    const oldName = document.getElementById('companyOldName').value;
    const data = {
        company_name: document.getElementById('companyName').value,
        city: document.getElementById('companyCity').value,
        industry: document.getElementById('companyIndustry').value || null,
        founded_year: document.getElementById('companyFoundedYear').value || null,
        phone: document.getElementById('companyPhone').value || null,
        email: document.getElementById('companyEmail').value || null,
        address: document.getElementById('companyAddress').value || null
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
    if (!confirm(`Delete company "${name}"? This will remove all employee assignments.`)) return;
    
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
        populateEmployeeDropdowns();
    } catch (error) {
        showToast('Error loading employees', 'error');
    }
}

function setEmployeeView(mode) {
    employeeViewMode = mode;
    document.querySelectorAll('.view-toggle button').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    if (mode === 'grid') {
        document.getElementById('employeeGridView').style.display = 'grid';
        document.getElementById('employeeTableView').style.display = 'none';
    } else {
        document.getElementById('employeeGridView').style.display = 'none';
        document.getElementById('employeeTableView').style.display = 'block';
    }
    renderEmployees(allEmployees);
}

function renderEmployees(employees) {
    // Grid view
    const gridHtml = employees.map(e => `
        <div class="employee-card">
            <div class="employee-card-header">
                <div class="employee-photo">
                    ${e.photo_url ? `<img src="${e.photo_url}" alt="${e.emp_name}" onerror="this.parentElement.innerHTML='${getInitials(e.emp_name)}'">` : getInitials(e.emp_name)}
                </div>
                <div class="employee-info">
                    <h3>${e.emp_name}</h3>
                    <p>${e.job_title || 'Employee'}</p>
                </div>
            </div>
            <div class="employee-details">
                <p>📧 ${e.email || 'No email'}</p>
                <p>📞 ${e.phone || 'No phone'}</p>
                <p>🏢 ${e.department || 'No department'}</p>
                <p><span class="badge ${e.status === 'Active' ? 'badge-success' : e.status === 'On Leave' ? 'badge-warning' : 'badge-danger'}">${e.status || 'Active'}</span></p>
            </div>
            <div class="employee-card-actions">
                <button class="btn btn-small btn-secondary" onclick='editEmployee(${JSON.stringify(e).replace(/'/g, "\\'")})'>Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteEmployee(${e.emp_id})">Delete</button>
            </div>
        </div>
    `).join('') || '<div class="empty-state"><span>👥</span><p>No employees found</p></div>';
    
    document.getElementById('employeeGridView').innerHTML = gridHtml;
    
    // Table view
    const tableHtml = employees.map(e => `
        <tr>
            <td>
                <div class="employee-photo" style="width:40px;height:40px;font-size:1rem">
                    ${e.photo_url ? `<img src="${e.photo_url}" alt="${e.emp_name}" onerror="this.parentElement.innerHTML='${getInitials(e.emp_name)}'">` : getInitials(e.emp_name)}
                </div>
            </td>
            <td><strong>${e.emp_name}</strong></td>
            <td>${e.email || '-'}</td>
            <td>${e.job_title || '-'}</td>
            <td>${e.department || '-'}</td>
            <td><span class="badge ${e.status === 'Active' ? 'badge-success' : e.status === 'On Leave' ? 'badge-warning' : 'badge-danger'}">${e.status || 'Active'}</span></td>
            <td class="actions">
                <button class="btn btn-small btn-secondary" onclick='editEmployee(${JSON.stringify(e).replace(/'/g, "\\'")})'>Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteEmployee(${e.emp_id})">Delete</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="empty-state">No employees found</td></tr>';
    
    document.getElementById('employeesTable').innerHTML = tableHtml;
}

function searchEmployees() {
    const search = document.getElementById('employeeSearch').value.toLowerCase();
    const filtered = allEmployees.filter(e => 
        e.emp_name.toLowerCase().includes(search) || 
        (e.email && e.email.toLowerCase().includes(search)) ||
        (e.job_title && e.job_title.toLowerCase().includes(search)) ||
        (e.department && e.department.toLowerCase().includes(search))
    );
    renderEmployees(filtered);
}

function populateEmployeeDropdowns() {
    const options = '<option value="">-- No Manager --</option>' + 
        allEmployees.map(e => `<option value="${e.emp_id}">${e.emp_name}</option>`).join('');
    
    document.getElementById('managerId').innerHTML = options;
    document.getElementById('managesManagerId').innerHTML = options.replace('-- No Manager --', '-- Select Manager --');
    document.getElementById('managesEmpId').innerHTML = options.replace('-- No Manager --', '-- Select Employee --');
    document.getElementById('depEmployeeId').innerHTML = options.replace('-- No Manager --', '-- Select Employee --');
    
    const empOptions = '<option value="">-- Select Employee --</option>' + 
        allEmployees.map(e => `<option value="${e.emp_id}">${e.emp_name}</option>`).join('');
    document.getElementById('worksEmpId').innerHTML = empOptions;
}

function openEmployeeModal() {
    document.getElementById('employeeModalTitle').textContent = 'Add Employee';
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('photoPreview').innerHTML = '👤';
    document.getElementById('empCountry').value = 'USA';
    document.getElementById('empType').value = 'Full-time';
    document.getElementById('empStatus').value = 'Active';
    openModal('employeeModal');
}

function editEmployee(e) {
    document.getElementById('employeeModalTitle').textContent = 'Edit Employee';
    document.getElementById('employeeId').value = e.emp_id;
    
    // Photo
    document.getElementById('photoUrl').value = e.photo_url || '';
    if (e.photo_url) {
        document.getElementById('photoPreview').innerHTML = `<img src="${e.photo_url}" alt="${e.emp_name}">`;
    } else {
        document.getElementById('photoPreview').innerHTML = getInitials(e.emp_name);
    }
    
    // Personal info
    document.getElementById('empName').value = e.emp_name || '';
    document.getElementById('empEmail').value = e.email || '';
    document.getElementById('empPhone').value = e.phone || '';
    document.getElementById('empDob').value = e.date_of_birth ? e.date_of_birth.split('T')[0] : '';
    document.getElementById('empGender').value = e.gender || '';
    document.getElementById('empMaritalStatus').value = e.marital_status || '';
    document.getElementById('empNationality').value = e.nationality || '';
    
    // Address
    document.getElementById('streetNo').value = e.street_no || '';
    document.getElementById('streetName').value = e.street_name || '';
    document.getElementById('empCity').value = e.city || '';
    document.getElementById('empState').value = e.state || '';
    document.getElementById('empZip').value = e.zip_code || '';
    document.getElementById('empCountry').value = e.country || 'USA';
    
    // Employment
    document.getElementById('empJobTitle').value = e.job_title || '';
    document.getElementById('empDepartment').value = e.department || '';
    document.getElementById('empHireDate').value = e.hire_date ? e.hire_date.split('T')[0] : '';
    document.getElementById('empType').value = e.employment_type || 'Full-time';
    document.getElementById('empStatus').value = e.status || 'Active';
    document.getElementById('managerId').value = e.manager_id || '';
    
    // Emergency contact
    document.getElementById('emergencyName').value = e.emergency_contact_name || '';
    document.getElementById('emergencyPhone').value = e.emergency_contact_phone || '';
    document.getElementById('emergencyRelation').value = e.emergency_contact_relation || '';
    
    openModal('employeeModal');
}

// Photo URL preview
document.getElementById('photoUrl')?.addEventListener('input', function() {
    const url = this.value;
    if (url) {
        document.getElementById('photoPreview').innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='❌'">`;
    } else {
        document.getElementById('photoPreview').innerHTML = '👤';
    }
});

async function saveEmployee(e) {
    e.preventDefault();
    const empId = document.getElementById('employeeId').value;
    
    const data = {
        emp_name: document.getElementById('empName').value,
        email: document.getElementById('empEmail').value || null,
        phone: document.getElementById('empPhone').value || null,
        date_of_birth: document.getElementById('empDob').value || null,
        gender: document.getElementById('empGender').value || null,
        marital_status: document.getElementById('empMaritalStatus').value || null,
        nationality: document.getElementById('empNationality').value || null,
        photo_url: document.getElementById('photoUrl').value || null,
        street_no: document.getElementById('streetNo').value || null,
        street_name: document.getElementById('streetName').value || null,
        city: document.getElementById('empCity').value || null,
        state: document.getElementById('empState').value || null,
        zip_code: document.getElementById('empZip').value || null,
        country: document.getElementById('empCountry').value || null,
        job_title: document.getElementById('empJobTitle').value || null,
        department: document.getElementById('empDepartment').value || null,
        hire_date: document.getElementById('empHireDate').value || null,
        employment_type: document.getElementById('empType').value || 'Full-time',
        status: document.getElementById('empStatus').value || 'Active',
        manager_id: document.getElementById('managerId').value || null,
        emergency_contact_name: document.getElementById('emergencyName').value || null,
        emergency_contact_phone: document.getElementById('emergencyPhone').value || null,
        emergency_contact_relation: document.getElementById('emergencyRelation').value || null
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
    if (!confirm('Delete this employee? This will also remove their work assignments and dependents.')) return;
    
    try {
        await api(`/employees/${id}`, 'DELETE');
        showToast('Employee deleted');
        loadEmployees();
    } catch (error) {
        showToast('Error deleting employee', 'error');
    }
}

// ===================== DEPENDENTS =====================
async function loadDependents() {
    try {
        const [depsRes, empsRes] = await Promise.all([
            api('/dependents'),
            api('/employees')
        ]);
        allDependents = depsRes.data || [];
        allEmployees = empsRes.data || [];
        renderDependents(allDependents);
        populateEmployeeDropdowns();
    } catch (error) {
        showToast('Error loading dependents', 'error');
    }
}

function renderDependents(dependents) {
    const html = dependents.map(d => {
        const emp = allEmployees.find(e => e.emp_id === d.emp_id);
        return `
            <tr>
                <td><strong>${d.dependent_name}</strong></td>
                <td>${d.relationship}</td>
                <td>${emp ? emp.emp_name : `Employee #${d.emp_id}`}</td>
                <td>${formatDate(d.date_of_birth)}</td>
                <td>${d.is_emergency_contact ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-info">No</span>'}</td>
                <td class="actions">
                    <button class="btn btn-small btn-secondary" onclick='editDependent(${JSON.stringify(d).replace(/'/g, "\\'")})'>Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteDependent(${d.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="6" class="empty-state"><span>👨‍👩‍👧</span><p>No dependents found</p></td></tr>';
    
    document.getElementById('dependentsTable').innerHTML = html;
}

function searchDependents() {
    const search = document.getElementById('dependentSearch').value.toLowerCase();
    const filtered = allDependents.filter(d => {
        const emp = allEmployees.find(e => e.emp_id === d.emp_id);
        return d.dependent_name.toLowerCase().includes(search) ||
               d.relationship.toLowerCase().includes(search) ||
               (emp && emp.emp_name.toLowerCase().includes(search));
    });
    renderDependents(filtered);
}

function openDependentModal() {
    document.getElementById('dependentModalTitle').textContent = 'Add Dependent';
    document.getElementById('dependentForm').reset();
    document.getElementById('dependentId').value = '';
    openModal('dependentModal');
}

function editDependent(d) {
    document.getElementById('dependentModalTitle').textContent = 'Edit Dependent';
    document.getElementById('dependentId').value = d.id;
    document.getElementById('depEmployeeId').value = d.emp_id;
    document.getElementById('depName').value = d.dependent_name;
    document.getElementById('depRelation').value = d.relationship;
    document.getElementById('depDob').value = d.date_of_birth ? d.date_of_birth.split('T')[0] : '';
    document.getElementById('depGender').value = d.gender || '';
    document.getElementById('depPhone').value = d.phone || '';
    document.getElementById('depEmail').value = d.email || '';
    document.getElementById('depEmergency').checked = d.is_emergency_contact;
    openModal('dependentModal');
}

async function saveDependent(e) {
    e.preventDefault();
    const id = document.getElementById('dependentId').value;
    
    const data = {
        emp_id: document.getElementById('depEmployeeId').value,
        dependent_name: document.getElementById('depName').value,
        relationship: document.getElementById('depRelation').value,
        date_of_birth: document.getElementById('depDob').value || null,
        gender: document.getElementById('depGender').value || null,
        phone: document.getElementById('depPhone').value || null,
        email: document.getElementById('depEmail').value || null,
        is_emergency_contact: document.getElementById('depEmergency').checked
    };
    
    try {
        if (id) {
            await api(`/dependents/${id}`, 'PUT', data);
            showToast('Dependent updated');
        } else {
            await api('/dependents', 'POST', data);
            showToast('Dependent added');
        }
        closeModal('dependentModal');
        loadDependents();
    } catch (error) {
        showToast('Error saving dependent', 'error');
    }
}

async function deleteDependent(id) {
    if (!confirm('Delete this dependent?')) return;
    
    try {
        await api(`/dependents/${id}`, 'DELETE');
        showToast('Dependent deleted');
        loadDependents();
    } catch (error) {
        showToast('Error deleting dependent', 'error');
    }
}

// ===================== WORKS =====================
async function loadWorks() {
    try {
        const [worksRes, companiesRes, empsRes] = await Promise.all([
            api('/works'),
            api('/companies'),
            api('/employees')
        ]);
        allWorks = worksRes.data || [];
        allCompanies = companiesRes.data || [];
        allEmployees = empsRes.data || [];
        renderWorks(allWorks);
        populateCompanyDropdown();
        populateEmployeeDropdowns();
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
                <button class="btn btn-small btn-secondary" onclick="editWorks(${w.emp_id}, '${w.company_name.replace(/'/g, "\\'")}', ${w.salary})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteWorks(${w.emp_id}, '${w.company_name.replace(/'/g, "\\'")}')">Remove</button>
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
    openModal('worksModal');
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
        await loadEmployees();
    } catch (error) {
        showToast('Error loading management data', 'error');
    }
}

function renderManages(manages) {
    const html = manages.map(m => `
        <tr>
            <td><strong>${m.emp_name || `Employee #${m.emp_id}`}</strong></td>
            <td><strong>${m.manager_name || `Manager #${m.manager_id}`}</strong></td>
            <td class="actions">
                <button class="btn btn-small btn-danger" onclick="deleteManages(${m.emp_id})">Remove</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="3" class="empty-state"><span>👔</span><p>No management relationships</p></td></tr>';
    
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
        const [byCompany, depsRes, empsRes, worksRes] = await Promise.all([
            api('/reports/salary-by-company'),
            api('/dependents'),
            api('/employees'),
            api('/works')
        ]);
        
        // Salary by company
        const companyData = byCompany.data || [];
        const companyHtml = companyData.slice(0, 10).map(c => `
            <div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee">
                <span>${c.company_name}</span>
                <strong>${formatCurrency(c.total_salary)}</strong>
            </div>
        `).join('') || '<p style="color:#666;padding:20px">No data available</p>';
        document.getElementById('salaryByCompanyReport').innerHTML = companyHtml;
        
        // Employees by dependent count
        const deps = depsRes.data || [];
        const empDeps = {};
        deps.forEach(d => {
            empDeps[d.emp_id] = (empDeps[d.emp_id] || 0) + 1;
        });
        const emps = empsRes.data || [];
        const empDepsData = emps.map(e => ({
            name: e.emp_name,
            count: empDeps[e.emp_id] || 0
        })).sort((a, b) => b.count - a.count).slice(0, 10);
        
        const depHtml = empDepsData.map(e => `
            <div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee">
                <span>${e.name}</span>
                <strong>${e.count} dependent${e.count !== 1 ? 's' : ''}</strong>
            </div>
        `).join('') || '<p style="color:#666;padding:20px">No data available</p>';
        document.getElementById('employeeDependentReport').innerHTML = depHtml;
        
        // Department report
        const works = worksRes.data || [];
        const deptStats = {};
        emps.forEach(e => {
            const dept = e.department || 'Unassigned';
            if (!deptStats[dept]) deptStats[dept] = { count: 0, salary: 0 };
            deptStats[dept].count++;
            const empWorks = works.filter(w => w.emp_id === e.emp_id);
            deptStats[dept].salary += empWorks.reduce((sum, w) => sum + (w.salary || 0), 0);
        });
        
        const deptHtml = Object.entries(deptStats).map(([dept, stats]) => `
            <tr>
                <td>${dept}</td>
                <td>${stats.count}</td>
                <td>${formatCurrency(stats.count > 0 ? stats.salary / stats.count : 0)}</td>
            </tr>
        `).join('') || '<tr><td colspan="3">No data available</td></tr>';
        document.getElementById('departmentReport').innerHTML = deptHtml;
        
    } catch (error) {
        console.error('Reports error:', error);
    }
}

// ===================== USER MANAGEMENT (Admin) =====================
let allUsers = [];
let pendingUsers = [];

function switchUserTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'pending') {
        document.getElementById('pendingUsersSection').style.display = 'block';
        document.getElementById('allUsersSection').style.display = 'none';
    } else {
        document.getElementById('pendingUsersSection').style.display = 'none';
        document.getElementById('allUsersSection').style.display = 'block';
    }
}

async function loadUsers() {
    if (currentUser?.role !== 'Admin') {
        document.getElementById('usersNav').style.display = 'none';
        return;
    }
    
    try {
        const [pendingRes, usersRes, countRes] = await Promise.all([
            api('/auth/pending-users'),
            api('/auth/users'),
            api('/auth/pending-count')
        ]);
        
        pendingUsers = pendingRes.users || [];
        allUsers = usersRes.users || [];
        
        const pendingCount = countRes.count || 0;
        const badge = document.getElementById('pendingBadge');
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
        
        renderPendingUsers(pendingUsers);
        renderAllUsers(allUsers);
    } catch (error) {
        console.error('Users error:', error);
    }
}

function renderPendingUsers(users) {
    const html = users.map(u => `
        <tr>
            <td>${u.full_name || '-'}</td>
            <td><strong>${u.username}</strong></td>
            <td>${u.email || '-'}</td>
            <td>${formatDate(u.created_at)}</td>
            <td class="actions">
                <button class="btn btn-small btn-success" onclick="approveUser(${u.id})">✓ Approve</button>
                <button class="btn btn-small btn-danger" onclick="rejectUser(${u.id})">✗ Reject</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="empty-state"><span>✓</span><p>No pending approvals</p></td></tr>';
    
    document.getElementById('pendingUsersTable').innerHTML = html;
}

function renderAllUsers(users) {
    const html = users.map(u => `
        <tr>
            <td>${u.full_name || '-'}</td>
            <td><strong>${u.username}</strong></td>
            <td>${u.email || '-'}</td>
            <td><span class="badge badge-info">${u.role}</span></td>
            <td><span class="badge ${u.status === 'Active' ? 'badge-success' : u.status === 'Pending' ? 'badge-warning' : 'badge-danger'}">${u.status}</span></td>
            <td class="actions">
                ${u.status === 'Active' ? `<button class="btn btn-small btn-warning" onclick="suspendUser(${u.id})">Suspend</button>` : ''}
                ${u.status === 'Suspended' ? `<button class="btn btn-small btn-success" onclick="reactivateUser(${u.id})">Reactivate</button>` : ''}
                ${u.username !== 'admin' ? `<button class="btn btn-small btn-danger" onclick="deleteUser(${u.id})">Delete</button>` : ''}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="empty-state">No users found</td></tr>';
    
    document.getElementById('allUsersTable').innerHTML = html;
}

async function approveUser(userId) {
    if (!confirm('Approve this user?')) return;
    try {
        await api(`/auth/approve/${userId}`, 'POST');
        showToast('User approved');
        loadUsers();
    } catch (error) {
        showToast('Error approving user', 'error');
    }
}

async function rejectUser(userId) {
    const reason = prompt('Enter rejection reason (optional):');
    try {
        await api(`/auth/reject/${userId}`, 'POST', { reason });
        showToast('User rejected');
        loadUsers();
    } catch (error) {
        showToast('Error rejecting user', 'error');
    }
}

async function suspendUser(userId) {
    if (!confirm('Suspend this user?')) return;
    try {
        await api(`/auth/suspend/${userId}`, 'POST');
        showToast('User suspended');
        loadUsers();
    } catch (error) {
        showToast('Error suspending user', 'error');
    }
}

async function reactivateUser(userId) {
    if (!confirm('Reactivate this user?')) return;
    try {
        await api(`/auth/reactivate/${userId}`, 'POST');
        showToast('User reactivated');
        loadUsers();
    } catch (error) {
        showToast('Error reactivating user', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Delete this user permanently?')) return;
    try {
        await api(`/auth/users/${userId}`, 'DELETE');
        showToast('User deleted');
        loadUsers();
    } catch (error) {
        showToast('Error deleting user', 'error');
    }
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
    
    if (newPass.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
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
            currentUser = res.user;
            document.getElementById('displayUsername').textContent = res.user.full_name || res.user.username;
            document.getElementById('userAvatar').textContent = getInitials(res.user.full_name || res.user.username);
            document.getElementById('userRole').textContent = res.user.role || 'User';
            
            // Show/hide admin features
            if (res.user.role === 'Admin') {
                document.getElementById('usersNav').style.display = 'flex';
                loadPendingCount();
            } else {
                document.getElementById('usersNav').style.display = 'none';
            }
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

async function loadPendingCount() {
    try {
        const res = await api('/auth/pending-count');
        const count = res.count || 0;
        const badge = document.getElementById('pendingBadge');
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Pending count error:', error);
    }
}

// Start the app
init();

