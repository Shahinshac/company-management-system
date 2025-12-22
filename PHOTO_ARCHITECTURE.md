# Photo Storage Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Browser)                          │
│                                                                   │
│  1. User selects image file                                      │
│     └─→ <input type="file" accept="image/*">                    │
│                                                                   │
│  2. JavaScript validation                                        │
│     ├─→ Check file size (max 5MB)                               │
│     ├─→ Check file type (must be image)                         │
│     └─→ Show error if invalid                                   │
│                                                                   │
│  3. Convert to Base64                                            │
│     └─→ FileReader.readAsDataURL(file)                          │
│                                                                   │
│  4. Display preview                                              │
│     └─→ <img src="data:image/jpeg;base64,...">                  │
│                                                                   │
│  5. Send to API                                                  │
│     └─→ POST /api/employees                                      │
│         { Photo: "data:image/jpeg;base64,..." }                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                     │
│                                                                   │
│  routes/employeeRoutes.js                                        │
│  ├─→ Receive POST request                                        │
│  ├─→ Validate request body                                       │
│  ├─→ Check photo size (max 7MB base64)                          │
│  └─→ Call Employee.create()                                      │
│                                                                   │
│  models/Employee.js                                              │
│  ├─→ Extract Photo from data                                     │
│  ├─→ Prepare SQL query                                           │
│  └─→ Execute INSERT with Photo                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ SQL Query
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MySQL)                            │
│                                                                   │
│  EMPLOYEE Table                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │ Id  │ Name      │ Email          │ Photo (LONGTEXT) │         │
│  ├─────┼───────────┼────────────────┼──────────────────┤         │
│  │ 1   │ John Doe  │ john@co...     │ data:image/...   │         │
│  │ 2   │ Jane Smith│ jane@co...     │ data:image/...   │         │
│  │ 3   │ Bob Wilson│ bob@co...      │ NULL             │         │
│  └─────┴───────────┴────────────────┴──────────────────┘         │
│                                                                   │
│  Storage: Base64 string stored as LONGTEXT                       │
│  Size: Up to 4GB per field (practical limit: 5MB original)       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ SQL Response
┌─────────────────────────────────────────────────────────────────┐
│                         RESPONSE                                 │
│                                                                   │
│  Success Response:                                               │
│  {                                                               │
│    "success": true,                                              │
│    "message": "Employee created successfully",                   │
│    "data": {                                                     │
│      "Id": 1,                                                    │
│      "Name": "John Doe",                                         │
│      "Photo": "data:image/jpeg;base64,..."                       │
│    }                                                             │
│  }                                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DISPLAY ON FRONTEND                          │
│                                                                   │
│  Employee List View:                                             │
│  ┌─────────────────────────────────────────────────┐            │
│  │ Photo │ ID │ Name      │ Email        │ Actions │            │
│  ├───────┼────┼───────────┼──────────────┼─────────┤            │
│  │  👨   │ 1  │ John Doe  │ john@co...   │ [View]  │            │
│  │  👩   │ 2  │ Jane Smith│ jane@co...   │ [View]  │            │
│  │  👤   │ 3  │ Bob Wilson│ bob@co...    │ [View]  │            │
│  └───────┴────┴───────────┴──────────────┴─────────┘            │
│                                                                   │
│  Implementation:                                                 │
│  <img src="${employee.Photo}" 
│       style="width:40px; height:40px; border-radius:50%">       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. File Selection & Validation

```javascript
// Client-side validation
function previewPhoto(event) {
  const file = event.target.files[0];
  
  // Size check
  if (file.size > 5 * 1024 * 1024) {
    alert('File too large!');
    return;
  }
  
  // Type check
  if (!file.type.startsWith('image/')) {
    alert('Not an image!');
    return;
  }
  
  // Convert & preview...
}
```

### 2. Base64 Conversion

```javascript
// Convert file to base64
const reader = new FileReader();
reader.onload = (e) => {
  const base64 = e.target.result;
  // Result: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
};
reader.readAsDataURL(file);
```

### 3. Server Validation

```javascript
// Server-side validation
if (req.body.Photo && req.body.Photo.length > 7000000) {
  return res.status(400).json({ 
    error: 'Photo size too large (max 5MB)' 
  });
}
```

### 4. Database Storage

```sql
-- Insert with photo
INSERT INTO EMPLOYEE (Name, Email, Photo) 
VALUES ('John Doe', 'john@example.com', 'data:image/jpeg;base64,...');

-- Query with photo
SELECT Id, Name, Email, Photo FROM EMPLOYEE WHERE Id = 1;
```

### 5. Display

```html
<!-- With photo -->
<img src="data:image/jpeg;base64,/9j/..." 
     style="width: 40px; height: 40px; border-radius: 50%;">

<!-- Without photo -->
<div style="width: 40px; height: 40px; border-radius: 50%; 
            background: #e0e0e0;">👤</div>
```

## Size Calculations

```
Original Image:   2 MB (2,097,152 bytes)
                  ↓
Base64 Encoding:  33% larger
                  ↓
Base64 Size:      2.66 MB (2,796,202 bytes)
                  ↓
Data URI:         + header (~30 bytes)
                  ↓
Total Storage:    ~2.66 MB in database
```

## Performance Considerations

```
Database Impact:
├─ Small deployment (<100 employees): Negligible
├─ Medium deployment (100-1000 employees): Monitor query times
└─ Large deployment (>1000 employees): Consider CDN/external storage

Optimization Strategies:
├─ Resize images to 400x400px before upload
├─ Use JPEG compression (80-85% quality)
├─ Implement pagination (25-50 records per page)
├─ Lazy load images in lists
└─ Cache employee data on client side
```

## Security Flow

```
┌─────────────────────┐
│  User uploads file  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│ Client-side validation      │
│ ├─ File type check          │
│ ├─ Size check (5MB)         │
│ └─ Format validation        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Convert to Base64           │
│ (data URI format)           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Send via HTTPS              │
│ (encrypted transmission)    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Server-side validation      │
│ ├─ Base64 size check (7MB)  │
│ ├─ Request body validation  │
│ └─ SQL injection prevention │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Store in MySQL              │
│ ├─ Parameterized query      │
│ ├─ Transaction safety       │
│ └─ Backup included          │
└─────────────────────────────┘
```

## Error Handling Flow

```
User Action → Validation → Storage → Response

Errors handled at each stage:

1. File Selection
   ├─ No file selected → "Please select a file"
   ├─ Wrong format → "Please select an image"
   └─ Too large → "File must be under 5MB"

2. Upload
   ├─ Network error → "Cannot connect to server"
   ├─ Server error → "Upload failed, try again"
   └─ Timeout → "Request took too long"

3. Server Processing
   ├─ Size exceeded → "Photo too large (max 5MB)"
   ├─ Invalid format → "Invalid photo format"
   └─ Database error → "Failed to save employee"

4. Database
   ├─ Connection lost → "Database unavailable"
   ├─ Constraint error → "Duplicate email"
   └─ Storage full → "Database storage limit"
```

## Multi-Branch Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Branch A (Main Office)                   │
│  ┌──────────┐                                               │
│  │ Employees├──────┐                                        │
│  │ with      │      │                                        │
│  │ Photos    │      │                                        │
│  └──────────┘      │                                        │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Central MySQL DB     │
         │  ┌─────────────────┐  │
         │  │ EMPLOYEE Table  │  │
         │  │ with Photos     │  │
         │  └─────────────────┘  │
         └───────────────────────┘
                     ▲
                     │
┌────────────────────┼────────────────────────────────────────┐
│                    │         Branch B (Regional Office)      │
│                    │   ┌──────────┐                         │
│                    └───┤ Employees│                         │
│                        │ with      │                         │
│                        │ Photos    │                         │
│                        └──────────┘                         │
└────────────────────────────────────────────────────────────┘

All branches:
├─ Connect to same database
├─ Share employee data and photos
├─ Real-time synchronization
└─ Consistent photo display
```

---

This architecture ensures:
- ✅ Secure photo storage
- ✅ Fast retrieval
- ✅ Multi-branch support
- ✅ Data integrity
- ✅ Easy backup/restore
