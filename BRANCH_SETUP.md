# 26:07 Company - Branch Setup Guide

## 5 Branches Overview

The company has been set up with **5 branches** across different locations with appropriate currencies:

| Branch | City | Country | Currency | Symbol |
|--------|------|---------|----------|--------|
| Malappuram Branch | Malappuram | India | INR | ₹ |
| Kochi Branch | Kochi | India | INR | ₹ |
| Bangalore Branch | Bangalore | India | INR | ₹ |
| Dubai Branch | Dubai | UAE | AED | د.إ |
| London Branch | London | UK | GBP | £ |

---

## Admin Credentials

### Main Super Admin
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** admin@26-07.com

### Branch Admins

| Branch | Username | Password | Email | Admin Name |
|--------|----------|----------|-------|------------|
| Malappuram | `admin_mlp` | `admin123` | admin.mlp@26-07.com | Rashid Karim |
| Kochi | `admin_kochi` | `admin123` | admin.kochi@26-07.com | Arun Menon |
| Bangalore | `admin_blr` | `admin123` | admin.blr@26-07.com | Karthik Sharma |
| Dubai | `admin_dubai` | `admin123` | admin.dubai@26-07.com | Ahmed Hassan |
| London | `admin_london` | `admin123` | admin.london@26-07.com | James Williams |

---

## Employees by Branch

### Malappuram Branch (5 Employees)
| Name | Email | Job Title | Department |
|------|-------|-----------|------------|
| Mohammed Ashraf | ashraf@26-07.com | Senior Developer | Engineering |
| Fathima Beevi | fathima@26-07.com | Project Manager | Management |
| Abdul Rahman | rahman@26-07.com | UI Designer | Design |
| Safiya Noor | safiya@26-07.com | Data Analyst | Analytics |
| Irfan Ali | irfan@26-07.com | Backend Developer | Engineering |

### Kochi Branch (5 Employees)
| Name | Email | Job Title | Department |
|------|-------|-----------|------------|
| Priya Nair | priya@26-07.com | Tech Lead | Engineering |
| Vijay Kumar | vijay@26-07.com | DevOps Engineer | Operations |
| Lakshmi Pillai | lakshmi@26-07.com | QA Engineer | Quality |
| Suresh Babu | suresh@26-07.com | Frontend Developer | Engineering |
| Deepa Thomas | deepa@26-07.com | HR Manager | Human Resources |

### Bangalore Branch (5 Employees)
| Name | Email | Job Title | Department |
|------|-------|-----------|------------|
| Ananya Reddy | ananya@26-07.com | Senior Architect | Engineering |
| Rahul Gowda | rahul.g@26-07.com | Product Manager | Product |
| Meera Shetty | meera@26-07.com | Cloud Engineer | Infrastructure |
| Naveen Prasad | naveen@26-07.com | Mobile Developer | Engineering |
| Divya Rao | divya@26-07.com | Data Scientist | Analytics |

### Dubai Branch (5 Employees)
| Name | Email | Job Title | Department |
|------|-------|-----------|------------|
| Fatima Al Maktoum | fatima.m@26-07.com | Operations Director | Operations |
| Omar Khalid | omar@26-07.com | Senior Developer | Engineering |
| Aisha Bin Rashid | aisha@26-07.com | Business Analyst | Business |
| Yusuf Al Ameri | yusuf@26-07.com | Security Engineer | Security |
| Mariam Khan | mariam@26-07.com | Marketing Manager | Marketing |

### London Branch (5 Employees)
| Name | Email | Job Title | Department |
|------|-------|-----------|------------|
| Emma Thompson | emma@26-07.com | CTO | Executive |
| Oliver Smith | oliver@26-07.com | Lead Engineer | Engineering |
| Sophie Brown | sophie@26-07.com | Finance Manager | Finance |
| William Taylor | william@26-07.com | Compliance Officer | Legal |
| Charlotte Davis | charlotte@26-07.com | UX Lead | Design |

---

## Salary Information

### Indian Branches (INR ₹)
- **Malappuram:** ₹65,000 - ₹85,000 per month
- **Kochi:** ₹60,000 - ₹90,000 per month
- **Bangalore:** ₹80,000 - ₹120,000 per month

### Dubai Branch (AED د.إ)
- **Range:** AED 15,000 - AED 25,000 per month

### London Branch (GBP £)
- **Range:** £5,000 - £8,500 per month

---

## Email Domain

All emails use the **@26-07.com** domain.

---

## Re-initializing Database

To reset and reinitialize the database with all branch data:

```bash
node database/init.js
```

Or use the dedicated branch setup script:

```bash
node scripts/setup-branches.js
```

---

## API Endpoints for Currencies

- **Get all currencies:** `GET /api/settings/currencies`
- **Get currency by city:** `GET /api/settings/currency/:city`
- **Get company info:** `GET /api/settings/company`

---

## Management Hierarchy

Each branch has the first employee as the manager:
- **Malappuram:** Mohammed Ashraf manages the team
- **Kochi:** Priya Nair manages the team
- **Bangalore:** Ananya Reddy manages the team
- **Dubai:** Fatima Al Maktoum manages the team
- **London:** Emma Thompson manages the team
