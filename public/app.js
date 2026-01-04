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

// Format currency - supports multi-currency based on branch location
function formatCurrency(amount, city = null) {
    // Branch-specific currencies
    const branchCurrencies = {
        'Malappuram': { currency: 'INR', symbol: '₹' },
        'Kochi': { currency: 'INR', symbol: '₹' },
        'Bangalore': { currency: 'INR', symbol: '₹' },
        'Dubai': { currency: 'AED', symbol: 'د.إ' },
        'London': { currency: 'GBP', symbol: '£' }
    };
    
    // If city is provided, use branch-specific currency
    if (city && branchCurrencies[city]) {
        return `${branchCurrencies[city].symbol}${Number(amount || 0).toLocaleString()}`;
    }
    
    // Default to INR
    const symbol = settings.currencySymbol || settings.currency_symbol || '₹';
    return `${symbol}${Number(amount || 0).toLocaleString()}`;
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
        departments: 'Departments',
        dependents: 'Dependents',
        works: 'Work Assignments',
        manages: 'Management',
        leaves: 'Leave Management',
        attendance: 'Attendance',
        documents: 'Documents',
        performance: 'Performance',
        reports: 'Reports & Analytics',
        users: 'User Management',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[pageId] || pageId;
    
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'companies') loadCompanies();
    if (pageId === 'employees') loadEmployees();
    if (pageId === 'departments') loadDepartments();
    if (pageId === 'dependents') loadDependents();
    if (pageId === 'works') loadWorks();
    if (pageId === 'manages') loadManages();
    if (pageId === 'leaves') loadLeaves();
    if (pageId === 'attendance') loadAttendance();
    if (pageId === 'documents') loadDocuments();
    if (pageId === 'performance') loadPerformance();
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
        const [companiesRes, employeesRes, worksRes, dependentsRes, leavesRes, birthdaysRes, anniversariesRes] = await Promise.all([
            api('/companies'),
            api('/employees'),
            api('/works'),
            api('/dependents'),
            api('/leaves/stats').catch(() => ({ data: {} })),
            api('/notifications/birthdays').catch(() => ({ data: [] })),
            api('/notifications/anniversaries').catch(() => ({ data: [] }))
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
        document.getElementById('statLeavesPending').textContent = leavesRes.data?.pending || 0;
        
        // Get document stats
        try {
            const docStats = await api('/documents/stats');
            document.getElementById('statDocExpiring').textContent = (docStats.data?.expiring_soon || 0) + (docStats.data?.expired || 0);
        } catch(e) {
            document.getElementById('statDocExpiring').textContent = '0';
        }
        
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
        
        // Upcoming Birthdays
        const birthdays = birthdaysRes.data || [];
        const birthdayHtml = birthdays.length > 0 ? birthdays.slice(0, 5).map(b => {
            const bday = new Date(b.date_of_birth);
            const today = new Date();
            const nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
            if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
            const daysUntil = Math.ceil((nextBday - today) / (1000 * 60 * 60 * 24));
            return `<div class="dependent-item">
                <div class="dependent-info">
                    <h4>🎂 ${b.emp_name}</h4>
                    <p>${b.department || 'Employee'} • ${formatDate(b.date_of_birth)}</p>
                </div>
                <span class="badge ${daysUntil === 0 ? 'badge-success' : 'badge-info'}">${daysUntil === 0 ? 'Today!' : daysUntil + ' days'}</span>
            </div>`;
        }).join('') : '<p style="text-align:center;color:#666;padding:20px">No upcoming birthdays</p>';
        document.getElementById('upcomingBirthdays').innerHTML = birthdayHtml;
        
        // Work Anniversaries
        const anniversaries = anniversariesRes.data || [];
        const anniversaryHtml = anniversaries.length > 0 ? anniversaries.slice(0, 5).map(a => {
            const hireDate = new Date(a.hire_date);
            const today = new Date();
            const nextAnniv = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
            if (nextAnniv < today) nextAnniv.setFullYear(today.getFullYear() + 1);
            const daysUntil = Math.ceil((nextAnniv - today) / (1000 * 60 * 60 * 24));
            return `<div class="dependent-item">
                <div class="dependent-info">
                    <h4>🎉 ${a.emp_name}</h4>
                    <p>${a.years || 1} year(s) • ${a.department || 'Employee'}</p>
                </div>
                <span class="badge ${daysUntil === 0 ? 'badge-success' : 'badge-info'}">${daysUntil === 0 ? 'Today!' : daysUntil + ' days'}</span>
            </div>`;
        }).join('') : '<p style="text-align:center;color:#666;padding:20px">No upcoming anniversaries</p>';
        document.getElementById('upcomingAnniversaries').innerHTML = anniversaryHtml;
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
        const usersNav = document.getElementById('usersNav');
        if (usersNav) usersNav.style.display = 'none';
        return;
    }
    
    try {
        const [pendingRes, usersRes, countRes] = await Promise.all([
            api('/auth/pending-users'),
            api('/auth/users'),
            api('/auth/pending-count')
        ]);
        
        // Handle potential error responses
        if (!pendingRes || !pendingRes.success) {
            console.error('Failed to load pending users:', pendingRes);
            pendingUsers = [];
        } else {
            pendingUsers = pendingRes.users || [];
        }
        
        if (!usersRes || !usersRes.success) {
            console.error('Failed to load users:', usersRes);
            allUsers = [];
        } else {
            allUsers = usersRes.users || [];
        }
        
        const pendingCount = countRes?.count || 0;
        const badge = document.getElementById('pendingBadge');
        if (badge) {
            if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
        
        renderPendingUsers(pendingUsers);
        renderAllUsers(allUsers);
    } catch (error) {
        console.error('Users error:', error);
        showToast('Error loading users: ' + error.message, 'error');
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

// ===================== DEPARTMENTS =====================
let allDepartments = [];

async function loadDepartments() {
    try {
        const res = await api('/departments');
        allDepartments = res.data || [];
        renderDepartments(allDepartments);
    } catch (error) {
        showToast('Error loading departments', 'error');
    }
}

function renderDepartments(departments) {
    const html = departments.map(d => `
        <tr>
            <td><strong>${d.name}</strong>${d.description ? `<br><small style="color:#666">${d.description}</small>` : ''}</td>
            <td>${d.head_name || '-'}</td>
            <td>${d.employee_count || 0}</td>
            <td>${formatCurrency(d.budget || 0)}</td>
            <td><span class="badge ${d.status === 'Active' ? 'badge-success' : 'badge-danger'}">${d.status}</span></td>
            <td class="actions">
                <button class="btn btn-small btn-secondary" onclick='editDepartment(${JSON.stringify(d).replace(/'/g, "\\'")})'>Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteDepartment(${d.id})">Delete</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="empty-state">No departments found</td></tr>';
    document.getElementById('departmentsTable').innerHTML = html;
}

function searchDepartments() {
    const q = document.getElementById('departmentSearch').value.toLowerCase();
    renderDepartments(allDepartments.filter(d => 
        d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
    ));
}

function openDepartmentModal(dept = null) {
    document.getElementById('departmentModalTitle').textContent = dept ? 'Edit Department' : 'Add Department';
    document.getElementById('departmentId').value = dept?.id || '';
    document.getElementById('deptName').value = dept?.name || '';
    document.getElementById('deptDescription').value = dept?.description || '';
    document.getElementById('deptLocation').value = dept?.location || '';
    document.getElementById('deptBudget').value = dept?.budget || '';
    document.getElementById('deptStatus').value = dept?.status || 'Active';
    
    // Populate head dropdown
    const headSelect = document.getElementById('deptHead');
    headSelect.innerHTML = '<option value="">-- Select --</option>' + 
        allEmployees.map(e => `<option value="${e.emp_id}" ${dept?.head_id == e.emp_id ? 'selected' : ''}>${e.emp_name}</option>`).join('');
    
    openModal('departmentModal');
}

function editDepartment(dept) {
    openDepartmentModal(dept);
}

async function saveDepartment(e) {
    e.preventDefault();
    const id = document.getElementById('departmentId').value;
    const data = {
        name: document.getElementById('deptName').value,
        description: document.getElementById('deptDescription').value,
        head_id: document.getElementById('deptHead').value || null,
        location: document.getElementById('deptLocation').value,
        budget: parseFloat(document.getElementById('deptBudget').value) || 0,
        status: document.getElementById('deptStatus').value
    };
    
    try {
        if (id) {
            await api(`/departments/${id}`, 'PUT', data);
        } else {
            await api('/departments', 'POST', data);
        }
        closeModal('departmentModal');
        loadDepartments();
        showToast('Department saved successfully');
    } catch (error) {
        showToast('Error saving department', 'error');
    }
}

async function deleteDepartment(id) {
    if (!confirm('Delete this department?')) return;
    try {
        await api(`/departments/${id}`, 'DELETE');
        loadDepartments();
        showToast('Department deleted');
    } catch (error) {
        showToast('Error deleting department', 'error');
    }
}

// ===================== LEAVE MANAGEMENT =====================
let allLeaves = [];
let allHolidays = [];
let currentLeaveId = null;

async function loadLeaves() {
    try {
        const res = await api('/leaves');
        allLeaves = res.data || [];
        renderLeaves(allLeaves);
        populateLeaveEmployeeDropdowns();
    } catch (error) {
        showToast('Error loading leaves', 'error');
    }
}

function renderLeaves(leaves) {
    const html = leaves.map(l => {
        const days = Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / (1000*60*60*24)) + 1;
        const statusClass = l.status === 'Approved' ? 'badge-success' : l.status === 'Rejected' ? 'badge-danger' : 'badge-warning';
        return `<tr>
            <td>${l.emp_name || 'Unknown'}</td>
            <td>${l.leave_type}</td>
            <td>${formatDate(l.start_date)}</td>
            <td>${formatDate(l.end_date)}</td>
            <td>${l.half_day ? '0.5' : days}</td>
            <td><span class="badge ${statusClass}">${l.status}</span></td>
            <td class="actions">
                ${l.status === 'Pending' ? `<button class="btn btn-small btn-success" onclick="openLeaveApproval(${l.id})">Review</button>` : ''}
                <button class="btn btn-small btn-danger" onclick="deleteLeave(${l.id})">Delete</button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" class="empty-state">No leave requests</td></tr>';
    document.getElementById('leavesTable').innerHTML = html;
}

function switchLeaveTab(tab) {
    document.querySelectorAll('#leaves .tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('leaveRequestsSection').style.display = tab === 'requests' ? 'block' : 'none';
    document.getElementById('leaveBalanceSection').style.display = tab === 'balance' ? 'block' : 'none';
    document.getElementById('holidaysSection').style.display = tab === 'holidays' ? 'block' : 'none';
    
    if (tab === 'balance') loadLeaveBalance();
    if (tab === 'holidays') loadHolidays();
}

async function loadLeaveBalance() {
    if (allEmployees.length === 0) {
        const res = await api('/employees');
        allEmployees = res.data || [];
    }
    
    // Show balance for first employee (in real app, would be current user's employee)
    if (allEmployees.length > 0) {
        const balanceRes = await api(`/leaves/balance/${allEmployees[0].emp_id}`);
        const balances = balanceRes.data || [];
        
        const html = balances.map(b => `
            <div class="stat-card ${b.used_days >= b.total_days ? 'orange' : 'green'}">
                <h3>${b.total_days - (b.used_days || 0)}</h3>
                <p>${b.leave_type} Leave</p>
                <small style="color:#666">Used: ${b.used_days || 0} / ${b.total_days} days</small>
            </div>
        `).join('');
        document.getElementById('leaveBalanceCards').innerHTML = html || '<p>No balance data</p>';
    }
}

async function loadHolidays() {
    try {
        const res = await api('/leaves/holidays');
        allHolidays = res.data || [];
        
        const html = allHolidays.map(h => `
            <tr>
                <td>${formatDate(h.date)}</td>
                <td><strong>${h.name}</strong>${h.description ? `<br><small>${h.description}</small>` : ''}</td>
                <td><span class="badge badge-info">${h.type}</span></td>
                <td>${h.applicable_branches || 'All'}</td>
                <td><button class="btn btn-small btn-danger" onclick="deleteHoliday(${h.id})">Delete</button></td>
            </tr>
        `).join('') || '<tr><td colspan="5">No holidays</td></tr>';
        document.getElementById('holidaysTable').innerHTML = html;
    } catch (error) {
        showToast('Error loading holidays', 'error');
    }
}

function searchLeaves() {
    const q = document.getElementById('leaveSearch').value.toLowerCase();
    renderLeaves(allLeaves.filter(l => 
        (l.emp_name || '').toLowerCase().includes(q) || l.leave_type.toLowerCase().includes(q)
    ));
}

function filterLeaves() {
    const status = document.getElementById('leaveStatusFilter').value;
    renderLeaves(status ? allLeaves.filter(l => l.status === status) : allLeaves);
}

function populateLeaveEmployeeDropdowns() {
    const options = '<option value="">-- Select --</option>' + 
        allEmployees.map(e => `<option value="${e.emp_id}">${e.emp_name}</option>`).join('');
    document.getElementById('leaveEmpId').innerHTML = options;
}

function openLeaveModal() {
    document.getElementById('leaveId').value = '';
    document.getElementById('leaveForm').reset();
    populateLeaveEmployeeDropdowns();
    openModal('leaveModal');
}

async function saveLeave(e) {
    e.preventDefault();
    const data = {
        emp_id: document.getElementById('leaveEmpId').value,
        leave_type: document.getElementById('leaveType').value,
        start_date: document.getElementById('leaveStart').value,
        end_date: document.getElementById('leaveEnd').value,
        reason: document.getElementById('leaveReason').value,
        half_day: document.getElementById('leaveHalfDay').checked
    };
    
    try {
        await api('/leaves', 'POST', data);
        closeModal('leaveModal');
        loadLeaves();
        showToast('Leave request submitted');
    } catch (error) {
        showToast('Error submitting leave', 'error');
    }
}

function openLeaveApproval(id) {
    currentLeaveId = id;
    const leave = allLeaves.find(l => l.id === id);
    if (!leave) return;
    
    const days = Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000*60*60*24)) + 1;
    document.getElementById('leaveApprovalDetails').innerHTML = `
        <div class="dependent-item" style="flex-direction:column;align-items:flex-start;gap:10px">
            <h4>${leave.emp_name}</h4>
            <p><strong>Type:</strong> ${leave.leave_type}</p>
            <p><strong>Duration:</strong> ${formatDate(leave.start_date)} to ${formatDate(leave.end_date)} (${leave.half_day ? '0.5' : days} days)</p>
            <p><strong>Reason:</strong> ${leave.reason || 'Not specified'}</p>
        </div>
    `;
    document.getElementById('leaveApprovalComments').value = '';
    openModal('leaveApprovalModal');
}

async function approveLeave() {
    try {
        await api(`/leaves/${currentLeaveId}/status`, 'PUT', {
            status: 'Approved',
            comments: document.getElementById('leaveApprovalComments').value
        });
        closeModal('leaveApprovalModal');
        loadLeaves();
        showToast('Leave approved');
    } catch (error) {
        showToast('Error approving leave', 'error');
    }
}

async function rejectLeave() {
    try {
        await api(`/leaves/${currentLeaveId}/status`, 'PUT', {
            status: 'Rejected',
            comments: document.getElementById('leaveApprovalComments').value
        });
        closeModal('leaveApprovalModal');
        loadLeaves();
        showToast('Leave rejected');
    } catch (error) {
        showToast('Error rejecting leave', 'error');
    }
}

async function deleteLeave(id) {
    if (!confirm('Delete this leave request?')) return;
    try {
        await api(`/leaves/${id}`, 'DELETE');
        loadLeaves();
        showToast('Leave deleted');
    } catch (error) {
        showToast('Error deleting leave', 'error');
    }
}

function openHolidayModal() {
    document.getElementById('holidayForm').reset();
    openModal('holidayModal');
}

async function saveHoliday(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('holidayName').value,
        date: document.getElementById('holidayDate').value,
        type: document.getElementById('holidayType').value,
        description: document.getElementById('holidayDescription').value,
        applicable_branches: document.getElementById('holidayBranches').value
    };
    
    try {
        await api('/leaves/holidays', 'POST', data);
        closeModal('holidayModal');
        loadHolidays();
        showToast('Holiday added');
    } catch (error) {
        showToast('Error adding holiday', 'error');
    }
}

async function deleteHoliday(id) {
    if (!confirm('Delete this holiday?')) return;
    try {
        await api(`/leaves/holidays/${id}`, 'DELETE');
        loadHolidays();
        showToast('Holiday deleted');
    } catch (error) {
        showToast('Error deleting holiday', 'error');
    }
}

// ===================== ATTENDANCE =====================
let attendanceData = [];
let selectedAttendanceEmployee = '';

async function loadAttendance() {
    // Populate employee dropdown
    if (allEmployees.length === 0) {
        const res = await api('/employees');
        allEmployees = res.data || [];
    }
    
    const options = '<option value="">All Employees</option>' + 
        allEmployees.map(e => `<option value="${e.emp_id}">${e.emp_name}</option>`).join('');
    document.getElementById('attendanceEmployee').innerHTML = options;
    document.getElementById('attEmpId').innerHTML = '<option value="">-- Select --</option>' + 
        allEmployees.map(e => `<option value="${e.emp_id}">${e.emp_name}</option>`).join('');
    
    // Set current month/year
    document.getElementById('attendanceMonth').value = new Date().getMonth() + 1;
    document.getElementById('attendanceYear').value = new Date().getFullYear();
    
    // Load all attendance by default
    await loadAttendanceForEmployee();
}

async function loadAttendanceForEmployee() {
    const empId = document.getElementById('attendanceEmployee').value;
    const month = document.getElementById('attendanceMonth').value;
    const year = document.getElementById('attendanceYear').value;
    
    try {
        let attRes, summaryRes;
        
        if (empId) {
            // Load for specific employee
            [attRes, summaryRes] = await Promise.all([
                api(`/leaves/attendance/${empId}?month=${month}&year=${year}`),
                api(`/leaves/attendance/${empId}/summary?month=${month}&year=${year}`)
            ]);
        } else {
            // Load all attendance
            [attRes, summaryRes] = await Promise.all([
                api(`/leaves/attendance/all?month=${month}&year=${year}`),
                api(`/leaves/attendance/summary?month=${month}&year=${year}`)
            ]);
        }
        
        attendanceData = attRes.data || [];
        const summary = summaryRes.data || {};
        
        // Render summary
        document.getElementById('attendanceSummary').innerHTML = `
            <div class="stat-card green"><h3>${summary.present || 0}</h3><p>Present</p></div>
            <div class="stat-card orange"><h3>${summary.late || 0}</h3><p>Late</p></div>
            <div class="stat-card purple"><h3>${summary.half_day || 0}</h3><p>Half Day</p></div>
            <div class="stat-card red"><h3>${summary.absent || 0}</h3><p>Absent</p></div>
        `;
        
        // Render table - show employee name when viewing all
        const showEmpName = !empId;
        const html = attendanceData.length > 0 ? attendanceData.map(a => {
            const statusClass = a.status === 'Present' ? 'badge-success' : a.status === 'Absent' ? 'badge-danger' : 'badge-warning';
            return `<tr>
                ${showEmpName ? `<td>${a.emp_name || 'Unknown'}</td>` : ''}
                <td>${formatDate(a.date)}</td>
                <td>${a.check_in || '-'}</td>
                <td>${a.check_out || '-'}</td>
                <td><span class="badge ${statusClass}">${a.status}</span></td>
                <td>${a.notes || '-'}</td>
            </tr>`;
        }).join('') : `<tr><td colspan="${showEmpName ? 6 : 5}">No attendance records for this period</td></tr>`;
        
        // Update table headers based on view
        const tableHead = document.querySelector('#attendance table thead tr');
        if (tableHead) {
            tableHead.innerHTML = showEmpName 
                ? '<th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Notes</th>'
                : '<th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Notes</th>';
        }
        
        document.getElementById('attendanceTable').innerHTML = html;
    } catch (error) {
        console.error('Attendance error:', error);
        showToast('Error loading attendance', 'error');
    }
}

function openAttendanceModal() {
    document.getElementById('attendanceForm').reset();
    document.getElementById('attDate').value = new Date().toISOString().split('T')[0];
    openModal('attendanceModal');
}

async function saveAttendance(e) {
    e.preventDefault();
    const data = {
        emp_id: document.getElementById('attEmpId').value,
        date: document.getElementById('attDate').value,
        check_in: document.getElementById('attCheckIn').value || null,
        check_out: document.getElementById('attCheckOut').value || null,
        status: document.getElementById('attStatus').value,
        notes: document.getElementById('attNotes').value
    };
    
    try {
        await api('/leaves/attendance', 'POST', data);
        closeModal('attendanceModal');
        loadAttendanceForEmployee();
        showToast('Attendance recorded');
    } catch (error) {
        showToast('Error recording attendance', 'error');
    }
}

// ===================== DOCUMENTS =====================
let allDocuments = [];
let currentDocTab = 'all';

async function loadDocuments() {
    try {
        const res = await api('/documents');
        allDocuments = res.data || [];
        renderDocuments(allDocuments);
        populateDocEmployeeDropdown();
    } catch (error) {
        showToast('Error loading documents', 'error');
    }
}

function renderDocuments(documents) {
    const html = documents.map(d => {
        const isExpired = d.expiry_date && new Date(d.expiry_date) < new Date();
        const isExpiring = d.expiry_date && !isExpired && 
            new Date(d.expiry_date) < new Date(Date.now() + 30*24*60*60*1000);
        
        return `<tr>
            <td><strong>${d.name}</strong>${d.description ? `<br><small>${d.description}</small>` : ''}</td>
            <td><span class="badge badge-info">${d.category}</span></td>
            <td>${d.emp_name || 'Company'}</td>
            <td>${d.expiry_date ? `<span class="${isExpired ? 'text-danger' : isExpiring ? 'text-warning' : ''}">${formatDate(d.expiry_date)}</span>` : '-'}</td>
            <td>${d.is_verified ? '<span class="badge badge-success">✓ Verified</span>' : '<span class="badge badge-warning">Pending</span>'}</td>
            <td class="actions">
                <a href="${d.file_url}" target="_blank" class="btn btn-small btn-secondary">View</a>
                ${!d.is_verified ? `<button class="btn btn-small btn-success" onclick="verifyDocument(${d.id})">Verify</button>` : ''}
                <button class="btn btn-small btn-danger" onclick="deleteDocument(${d.id})">Delete</button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="6" class="empty-state">No documents</td></tr>';
    document.getElementById('documentsTable').innerHTML = html;
}

function switchDocTab(tab) {
    currentDocTab = tab;
    document.querySelectorAll('#documents .tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'all') renderDocuments(allDocuments);
    else if (tab === 'expiring') loadExpiringDocs();
    else if (tab === 'expired') loadExpiredDocs();
}

async function loadExpiringDocs() {
    try {
        const res = await api('/documents/expiring');
        renderDocuments(res.data || []);
    } catch (error) {
        showToast('Error loading documents', 'error');
    }
}

async function loadExpiredDocs() {
    try {
        const res = await api('/documents/expired');
        renderDocuments(res.data || []);
    } catch (error) {
        showToast('Error loading documents', 'error');
    }
}

function searchDocuments() {
    const q = document.getElementById('documentSearch').value.toLowerCase();
    renderDocuments(allDocuments.filter(d => 
        d.name.toLowerCase().includes(q) || (d.emp_name || '').toLowerCase().includes(q)
    ));
}

function filterDocuments() {
    const cat = document.getElementById('documentCategory').value;
    renderDocuments(cat ? allDocuments.filter(d => d.category === cat) : allDocuments);
}

function populateDocEmployeeDropdown() {
    const options = '<option value="">-- Company Document --</option>' + 
        allEmployees.map(e => `<option value="${e.emp_id}">${e.emp_name}</option>`).join('');
    document.getElementById('docEmpId').innerHTML = options;
}

function openDocumentModal() {
    document.getElementById('documentId').value = '';
    document.getElementById('documentForm').reset();
    populateDocEmployeeDropdown();
    openModal('documentModal');
}

async function saveDocument(e) {
    e.preventDefault();
    const id = document.getElementById('documentId').value;
    const data = {
        name: document.getElementById('docName').value,
        category: document.getElementById('docCategory').value,
        emp_id: document.getElementById('docEmpId').value || null,
        file_url: document.getElementById('docUrl').value,
        file_type: document.getElementById('docFileType').value,
        expiry_date: document.getElementById('docExpiry').value || null,
        description: document.getElementById('docDescription').value
    };
    
    try {
        if (id) {
            await api(`/documents/${id}`, 'PUT', data);
        } else {
            await api('/documents', 'POST', data);
        }
        closeModal('documentModal');
        loadDocuments();
        showToast('Document saved');
    } catch (error) {
        showToast('Error saving document', 'error');
    }
}

async function verifyDocument(id) {
    try {
        await api(`/documents/${id}/verify`, 'PUT');
        loadDocuments();
        showToast('Document verified');
    } catch (error) {
        showToast('Error verifying document', 'error');
    }
}

async function deleteDocument(id) {
    if (!confirm('Delete this document?')) return;
    try {
        await api(`/documents/${id}`, 'DELETE');
        loadDocuments();
        showToast('Document deleted');
    } catch (error) {
        showToast('Error deleting document', 'error');
    }
}

// ===================== PERFORMANCE =====================
let allReviews = [];
let allGoals = [];

async function loadPerformance() {
    try {
        const res = await api('/performance');
        allReviews = res.data || [];
        renderReviews(allReviews);
        populatePerfEmployeeDropdowns();
    } catch (error) {
        showToast('Error loading performance data', 'error');
    }
}

function renderReviews(reviews) {
    const html = reviews.map(r => {
        const statusClass = r.status === 'Completed' ? 'badge-success' : r.status === 'Submitted' ? 'badge-info' : 'badge-warning';
        const rating = r.overall_rating ? `⭐ ${parseFloat(r.overall_rating).toFixed(1)}/5` : '-';
        return `<tr>
            <td>${r.emp_name}</td>
            <td>${r.review_period || '-'}</td>
            <td>${r.review_type}</td>
            <td>${rating}</td>
            <td><span class="badge ${statusClass}">${r.status}</span></td>
            <td class="actions">
                <button class="btn btn-small btn-secondary" onclick='editReview(${JSON.stringify(r).replace(/'/g, "\\'")})'>Edit</button>
                ${r.status === 'Draft' ? `<button class="btn btn-small btn-success" onclick="submitReview(${r.id})">Submit</button>` : ''}
                ${r.status === 'Submitted' ? `<button class="btn btn-small btn-success" onclick="completeReview(${r.id})">Complete</button>` : ''}
                <button class="btn btn-small btn-danger" onclick="deleteReview(${r.id})">Delete</button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="6" class="empty-state">No reviews</td></tr>';
    document.getElementById('reviewsTable').innerHTML = html;
}

function switchPerfTab(tab) {
    document.querySelectorAll('#performance .tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('reviewsSection').style.display = tab === 'reviews' ? 'block' : 'none';
    document.getElementById('goalsSection').style.display = tab === 'goals' ? 'block' : 'none';
    
    if (tab === 'goals') loadGoalsUI();
}

function populatePerfEmployeeDropdowns() {
    const options = '<option value="">-- Select --</option>' + 
        allEmployees.map(e => `<option value="${e.emp_id}">${e.emp_name}</option>`).join('');
    document.getElementById('reviewEmpId').innerHTML = options;
    document.getElementById('goalEmpId').innerHTML = options;
    document.getElementById('goalsEmployee').innerHTML = '<option value="">All Employees</option>' + 
        allEmployees.map(e => `<option value="${e.emp_id}">${e.emp_name}</option>`).join('');
}

async function loadGoalsUI() {
    populatePerfEmployeeDropdowns();
    await loadGoalsForEmployee(); // Load all goals by default
}

async function loadGoalsForEmployee() {
    const empId = document.getElementById('goalsEmployee').value;
    
    try {
        let res;
        if (empId) {
            res = await api(`/performance/goals/${empId}`);
        } else {
            res = await api('/performance/goals');
        }
        allGoals = res.data || [];
        
        const html = allGoals.length > 0 ? allGoals.map(g => {
            const statusClass = g.status === 'Completed' ? 'badge-success' : g.status === 'Overdue' ? 'badge-danger' : 'badge-warning';
            const progress = g.target_value && g.current_value ? 
                Math.min(100, Math.round((parseFloat(g.current_value) / parseFloat(g.target_value)) * 100)) : 0;
            return `<div class="dependent-item" style="flex-direction:column;align-items:stretch">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <h4>${g.title}${g.emp_name ? ` <small style="color:#888;font-weight:normal">(${g.emp_name})</small>` : ''}</h4>
                    <span class="badge ${statusClass}">${g.status}</span>
                </div>
                <p style="color:#666;margin:5px 0">${g.description || 'No description'}</p>
                <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:#888">
                    <span>📊 ${g.category} • ${g.priority} Priority</span>
                    <span>📅 Due: ${g.due_date ? formatDate(g.due_date) : 'No date'}</span>
                </div>
                ${g.target_value ? `<div style="margin-top:10px">
                    <div style="background:#e5e7eb;border-radius:10px;height:10px;overflow:hidden">
                        <div style="background:var(--primary);height:100%;width:${progress}%"></div>
                    </div>
                    <small>${g.current_value || 0} / ${g.target_value} ${g.unit || ''} (${progress}%)</small>
                </div>` : ''}
                <div style="margin-top:10px;display:flex;gap:10px">
                    <button class="btn btn-small btn-secondary" onclick='editGoal(${JSON.stringify(g).replace(/'/g, "\\'")})'>Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteGoal(${g.id})">Delete</button>
                </div>
            </div>`;
        }).join('') : '<p style="text-align:center;padding:20px">No goals set for this employee</p>';
        
        document.getElementById('goalsContainer').innerHTML = html;
    } catch (error) {
        showToast('Error loading goals', 'error');
    }
}

function searchReviews() {
    const q = document.getElementById('reviewSearch').value.toLowerCase();
    renderReviews(allReviews.filter(r => 
        r.emp_name.toLowerCase().includes(q) || (r.review_period || '').toLowerCase().includes(q)
    ));
}

function openReviewModal() {
    document.getElementById('reviewId').value = '';
    document.getElementById('reviewForm').reset();
    document.getElementById('reviewDate').value = new Date().toISOString().split('T')[0];
    populatePerfEmployeeDropdowns();
    openModal('reviewModal');
}

function editReview(review) {
    document.getElementById('reviewId').value = review.id;
    document.getElementById('reviewEmpId').value = review.emp_id;
    document.getElementById('reviewPeriod').value = review.review_period || '';
    document.getElementById('reviewType').value = review.review_type;
    document.getElementById('reviewDate').value = review.review_date?.split('T')[0] || '';
    document.getElementById('ratingOverall').value = review.overall_rating || '';
    document.getElementById('ratingGoals').value = review.goals_rating || '';
    document.getElementById('ratingSkills').value = review.skills_rating || '';
    document.getElementById('ratingTeamwork').value = review.teamwork_rating || '';
    document.getElementById('reviewStrengths').value = review.strengths || '';
    document.getElementById('reviewImprovements').value = review.areas_for_improvement || '';
    document.getElementById('reviewGoalsAchieved').value = review.goals_achieved || '';
    document.getElementById('reviewNewGoals').value = review.new_goals || '';
    populatePerfEmployeeDropdowns();
    openModal('reviewModal');
}

async function saveReview(e) {
    e.preventDefault();
    const id = document.getElementById('reviewId').value;
    const data = {
        emp_id: document.getElementById('reviewEmpId').value,
        review_period: document.getElementById('reviewPeriod').value,
        review_type: document.getElementById('reviewType').value,
        review_date: document.getElementById('reviewDate').value,
        overall_rating: parseFloat(document.getElementById('ratingOverall').value) || null,
        goals_rating: parseFloat(document.getElementById('ratingGoals').value) || null,
        skills_rating: parseFloat(document.getElementById('ratingSkills').value) || null,
        teamwork_rating: parseFloat(document.getElementById('ratingTeamwork').value) || null,
        strengths: document.getElementById('reviewStrengths').value,
        areas_for_improvement: document.getElementById('reviewImprovements').value,
        goals_achieved: document.getElementById('reviewGoalsAchieved').value,
        new_goals: document.getElementById('reviewNewGoals').value
    };
    
    try {
        if (id) {
            await api(`/performance/${id}`, 'PUT', data);
        } else {
            await api('/performance', 'POST', data);
        }
        closeModal('reviewModal');
        loadPerformance();
        showToast('Review saved');
    } catch (error) {
        showToast('Error saving review', 'error');
    }
}

async function submitReview(id) {
    try {
        await api(`/performance/${id}/submit`, 'PUT');
        loadPerformance();
        showToast('Review submitted');
    } catch (error) {
        showToast('Error submitting review', 'error');
    }
}

async function completeReview(id) {
    try {
        await api(`/performance/${id}/complete`, 'PUT');
        loadPerformance();
        showToast('Review completed');
    } catch (error) {
        showToast('Error completing review', 'error');
    }
}

async function deleteReview(id) {
    if (!confirm('Delete this review?')) return;
    try {
        await api(`/performance/${id}`, 'DELETE');
        loadPerformance();
        showToast('Review deleted');
    } catch (error) {
        showToast('Error deleting review', 'error');
    }
}

function openGoalModal() {
    document.getElementById('goalId').value = '';
    document.getElementById('goalForm').reset();
    populatePerfEmployeeDropdowns();
    
    // Pre-select employee if one is selected in the filter
    const selectedEmp = document.getElementById('goalsEmployee').value;
    if (selectedEmp) {
        document.getElementById('goalEmpId').value = selectedEmp;
    }
    
    openModal('goalModal');
}

function editGoal(goal) {
    document.getElementById('goalId').value = goal.id;
    document.getElementById('goalEmpId').value = goal.emp_id;
    document.getElementById('goalTitle').value = goal.title;
    document.getElementById('goalDescription').value = goal.description || '';
    document.getElementById('goalCategory').value = goal.category;
    document.getElementById('goalPriority').value = goal.priority;
    document.getElementById('goalTarget').value = goal.target_value || '';
    document.getElementById('goalDue').value = goal.due_date?.split('T')[0] || '';
    populatePerfEmployeeDropdowns();
    openModal('goalModal');
}

async function saveGoal(e) {
    e.preventDefault();
    const id = document.getElementById('goalId').value;
    const data = {
        emp_id: document.getElementById('goalEmpId').value,
        title: document.getElementById('goalTitle').value,
        description: document.getElementById('goalDescription').value,
        category: document.getElementById('goalCategory').value,
        priority: document.getElementById('goalPriority').value,
        target_value: document.getElementById('goalTarget').value || null,
        due_date: document.getElementById('goalDue').value || null
    };
    
    try {
        if (id) {
            await api(`/performance/goals/${id}`, 'PUT', data);
        } else {
            await api('/performance/goals', 'POST', data);
        }
        closeModal('goalModal');
        loadGoalsForEmployee();
        showToast('Goal saved');
    } catch (error) {
        showToast('Error saving goal', 'error');
    }
}

async function deleteGoal(id) {
    if (!confirm('Delete this goal?')) return;
    try {
        await api(`/performance/goals/${id}`, 'DELETE');
        loadGoalsForEmployee();
        showToast('Goal deleted');
    } catch (error) {
        showToast('Error deleting goal', 'error');
    }
}

// ===================== EXPORT FUNCTIONALITY =====================
function exportData() {
    const modal = `
        <div class="modal active" id="exportModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📥 Export Data</h2>
                    <button class="modal-close" onclick="closeModal('exportModal')">&times;</button>
                </div>
                <div style="display:flex;flex-direction:column;gap:15px">
                    <button class="btn btn-primary" onclick="exportToCSV('employees')">👥 Export Employees</button>
                    <button class="btn btn-success" onclick="exportToCSV('companies')">🏢 Export Companies</button>
                    <button class="btn btn-secondary" onclick="exportToCSV('works')">💼 Export Work Assignments</button>
                    <button class="btn btn-warning" onclick="exportToCSV('leaves')">🏖️ Export Leaves</button>
                    <button class="btn btn-info" onclick="exportToCSV('departments')">🏛️ Export Departments</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

async function exportToCSV(type) {
    try {
        let data = [];
        let filename = '';
        
        switch(type) {
            case 'employees':
                const empRes = await api('/employees');
                data = empRes.data || [];
                filename = 'employees.csv';
                break;
            case 'companies':
                const compRes = await api('/companies');
                data = compRes.data || [];
                filename = 'companies.csv';
                break;
            case 'works':
                const workRes = await api('/works');
                data = workRes.data || [];
                filename = 'work_assignments.csv';
                break;
            case 'leaves':
                const leaveRes = await api('/leaves');
                data = leaveRes.data || [];
                filename = 'leaves.csv';
                break;
            case 'departments':
                const deptRes = await api('/departments');
                data = deptRes.data || [];
                filename = 'departments.csv';
                break;
        }
        
        if (data.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }
        
        // Convert to CSV
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                const val = row[h];
                if (val === null || val === undefined) return '';
                const str = String(val).replace(/"/g, '""');
                return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
            }).join(','))
        ].join('\n');
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        closeModal('exportModal');
        showToast(`${type} exported successfully`);
    } catch (error) {
        showToast('Error exporting data', 'error');
    }
}