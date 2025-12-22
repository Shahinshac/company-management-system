# 📸 Photo Feature - Quick Reference

## Setup Commands

```bash
# For NEW installations
npm run init-db

# For EXISTING installations
npm run migrate-photo

# Start server
npm run dev
```

## Testing

**Test Page:** http://localhost:3000/photo-test.html
- Quick way to test photo upload
- Shows file info and preview
- Direct API testing

**Main Dashboard:** http://localhost:3000
- Full employee management
- Photo display in tables
- Add/Edit with photos

## File Specifications

| Property | Value |
|----------|-------|
| Max Size | 5MB original |
| Max Base64 | ~7MB |
| Formats | JPEG, PNG, GIF, WebP, all images |
| Storage | MySQL LONGTEXT |
| Display | 40x40px (list), larger (details) |

## API Usage

### Create with Photo
```bash
POST /api/employees
Content-Type: application/json

{
  "Name": "John Doe",
  "Gender": "Male",
  "Email": "john@company.com",
  "Photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Update Photo Only
```bash
PUT /api/employees/1
Content-Type: application/json

{
  "Photo": "data:image/png;base64,iVBORw0KGg..."
}
```

### Get Employee with Photo
```bash
GET /api/employees/1

Response:
{
  "success": true,
  "data": {
    "Id": 1,
    "Name": "John Doe",
    "Photo": "data:image/jpeg;base64,/9j/..."
  }
}
```

## Frontend Code

### Upload Photo
```javascript
const fileInput = document.getElementById('photoInput');
const file = fileInput.files[0];
const reader = new FileReader();

reader.onload = async (e) => {
  const base64Photo = e.target.result;
  
  await fetch('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Name: "Jane Doe",
      Photo: base64Photo
    })
  });
};

reader.readAsDataURL(file);
```

### Display Photo
```javascript
// With photo
<img src="${employee.Photo}" 
     style="width: 40px; height: 40px; border-radius: 50%;">

// Without photo (default avatar)
<div style="width: 40px; height: 40px; border-radius: 50%; 
            background: #e0e0e0; display: flex; 
            align-items: center; justify-content: center;">
  👤
</div>
```

## Database Query

```sql
-- Get employee with photo
SELECT Id, Name, Photo FROM EMPLOYEE WHERE Id = 1;

-- Update photo
UPDATE EMPLOYEE SET Photo = ? WHERE Id = 1;

-- Remove photo
UPDATE EMPLOYEE SET Photo = NULL WHERE Id = 1;

-- Count employees with photos
SELECT COUNT(*) FROM EMPLOYEE WHERE Photo IS NOT NULL;
```

## Validation Rules

✅ File must be an image
✅ Size ≤ 5MB original
✅ Base64 ≤ 7,000,000 characters
✅ Valid data URI format
❌ Non-image files rejected
❌ Oversized files rejected

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Photo size too large" | Compress/resize image before upload |
| Photo not displaying | Check base64 format includes data URI |
| Slow loading | Implement pagination/lazy loading |
| Database error | Run migration: `npm run migrate-photo` |

## File Locations

```
company/
├── database/
│   ├── init.js                  (schema with Photo)
│   └── migrate-add-photo.js     (migration script)
├── models/
│   └── Employee.js              (Photo in CRUD)
├── routes/
│   └── employeeRoutes.js        (validation)
├── public/
│   ├── index.html               (photo upload UI)
│   ├── app.js                   (photo handling)
│   └── photo-test.html          (test page)
└── PHOTO_FEATURE.md             (full docs)
```

## Tips

💡 **Optimize images**: Resize to 400x400px before upload
💡 **Use JPEG**: Smaller file size for photos
💡 **Compress**: 80-85% quality is ideal
💡 **Test first**: Use photo-test.html page
💡 **Backup**: Photos included in DB backups

## Support

📖 Full Documentation: `PHOTO_FEATURE.md`
🧪 Test Page: http://localhost:3000/photo-test.html
🏠 Dashboard: http://localhost:3000
📊 API Health: http://localhost:3000/api/health

---
✅ Photo feature ready to use!
