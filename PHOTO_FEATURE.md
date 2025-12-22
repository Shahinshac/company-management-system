# Employee Photo Storage Feature

## Overview

The Company Management System now supports storing employee profile photos directly in the database. Photos are stored as base64-encoded strings in the MySQL database.

## Features

✅ **Upload Photos**: Add photos during employee creation or update
✅ **Photo Preview**: Live preview before saving
✅ **Photo Display**: View photos in employee listings and details
✅ **Size Validation**: Automatic validation (max 5MB)
✅ **Format Support**: All common image formats (JPEG, PNG, GIF, WebP, etc.)
✅ **Database Storage**: Photos stored as LONGTEXT (base64) in MySQL

## Database Schema

### EMPLOYEE Table - Photo Field

```sql
Photo LONGTEXT
```

- **Type**: LONGTEXT (stores up to 4GB)
- **Format**: Base64 encoded image data with data URI scheme
- **Example**: `data:image/jpeg;base64,/9j/4AAQSkZJRg...`
- **Nullable**: Yes (employees can exist without photos)

## Frontend Implementation

### 1. Photo Upload Form

The employee form includes a file input for photo upload:

```html
<input type="file" id="empPhoto" accept="image/*" onchange="previewPhoto(event)">
```

**Features:**
- File type restriction: `accept="image/*"`
- Preview before saving
- Remove photo option
- Visual feedback with preview thumbnail

### 2. Photo Display

Photos are displayed in:
- **Employee List**: Circular thumbnail (40x40px)
- **Employee Details**: Larger preview
- **Search Results**: Thumbnails with results

**Default Placeholder:**
When no photo is available, a default avatar icon (👤) is displayed.

### 3. Photo Preview

```javascript
function previewPhoto(event) {
    const file = event.target.files[0];
    // Validates size (max 5MB)
    // Validates format (must be image)
    // Converts to base64
    // Displays preview
}
```

## Backend Implementation

### 1. API Endpoints

#### Create Employee with Photo
```http
POST /api/employees
Content-Type: application/json

{
  "Name": "John Doe",
  "Email": "john@company.com",
  "Photo": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

#### Update Employee Photo
```http
PUT /api/employees/1
Content-Type: application/json

{
  "Name": "John Doe",
  "Photo": "data:image/png;base64,iVBORw0KG..."
}
```

### 2. Validation

**Server-side validation:**
- Maximum size: 5MB (7,000,000 characters for base64)
- Automatic error response if exceeded

```javascript
if (req.body.Photo && req.body.Photo.length > 7000000) {
  return res.status(400).json({ 
    success: false, 
    error: 'Photo size too large (max 5MB)' 
  });
}
```

### 3. Database Operations

**Insert with Photo:**
```sql
INSERT INTO EMPLOYEE (..., Photo) 
VALUES (..., ?);
```

**Update Photo:**
```sql
UPDATE EMPLOYEE 
SET Photo = ? 
WHERE Id = ?;
```

**Retrieve with Photo:**
```sql
SELECT Id, Name, Photo, ... 
FROM EMPLOYEE;
```

## Usage Guide

### For New Installations

1. Run database initialization:
   ```bash
   npm run init-db
   ```
   This creates the EMPLOYEE table with the Photo field.

### For Existing Installations

1. Run the migration script:
   ```bash
   npm run migrate-photo
   ```
   This adds the Photo column to your existing EMPLOYEE table.

2. Restart the server:
   ```bash
   npm run dev
   ```

### Adding Employee with Photo (Web Interface)

1. Click **"+ Add Employee"**
2. Click **"Choose File"** under Profile Photo
3. Select an image (max 5MB)
4. Preview appears automatically
5. Fill in other employee details
6. Click **"Save Employee"**

### Adding Employee with Photo (API)

```javascript
// Convert image to base64
const imageFile = document.querySelector('#fileInput').files[0];
const reader = new FileReader();

reader.onload = async function(e) {
  const base64Photo = e.target.result;
  
  const response = await fetch('http://localhost:3000/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Name: "Jane Smith",
      Gender: "Female",
      Email: "jane@company.com",
      Photo: base64Photo
    })
  });
};

reader.readAsDataURL(imageFile);
```

### Viewing Employee Photos

**In Employee List:**
- Photos appear as circular thumbnails in the first column
- Hover for better visibility
- Default avatar shown if no photo

**In Employee Details:**
- View full employee record with photo
- Larger photo display
- All employee information together

## Technical Details

### Base64 Encoding

**What is Base64?**
Base64 is a binary-to-text encoding scheme that represents binary data in ASCII format.

**Format:**
```
data:image/[format];base64,[encoded_data]
```

**Example:**
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...
```

**Size Calculation:**
- Original file: 1MB
- Base64 encoded: ~1.33MB (33% larger)
- 5MB limit = ~3.75MB original image

### Storage Considerations

**Pros:**
- ✅ No file system management
- ✅ Database backup includes photos
- ✅ Easy replication across branches
- ✅ Transactional integrity
- ✅ Simple API responses

**Cons:**
- ⚠️ Larger database size
- ⚠️ Slower queries with many photos
- ⚠️ Limited to 5MB per photo

**Recommendations:**
- For production: Consider CDN/cloud storage for large deployments
- Current implementation: Ideal for <1000 employees
- Optimize: Compress images before upload

### Performance Tips

1. **Image Optimization:**
   - Resize images before upload (recommended: 400x400px)
   - Use JPEG format for photos (smaller size)
   - Compress images (quality: 80-85%)

2. **Database Optimization:**
   - Index on Id for faster photo retrieval
   - Consider separate photo table for large datasets
   - Regular database optimization

3. **Frontend Optimization:**
   - Lazy load images in long lists
   - Cache photo data
   - Use CSS object-fit for consistent sizing

## Troubleshooting

### Issue: "Photo size too large"
**Solution:** 
- Resize image before upload
- Compress image quality
- Convert to JPEG format

### Issue: Photo not displaying
**Check:**
1. Base64 string includes data URI prefix
2. Image data is valid
3. Browser console for errors
4. Database field is LONGTEXT

### Issue: Slow loading with photos
**Solutions:**
1. Implement pagination
2. Lazy load images
3. Use thumbnail-only for list views
4. Consider external storage

## Migration from File Storage

If you previously stored photos as files:

```javascript
// Convert file path to base64
const fs = require('fs');
const path = require('path');

function convertFileToBase64(filePath) {
  const fileData = fs.readFileSync(filePath);
  const base64 = fileData.toString('base64');
  const mimeType = 'image/jpeg'; // Detect from file
  return `data:${mimeType};base64,${base64}`;
}

// Update employee records
const photoBase64 = convertFileToBase64('./photos/employee1.jpg');
// Update via API or direct database query
```

## Security Considerations

1. **File Type Validation**: Only image files accepted
2. **Size Limits**: 5MB maximum prevents abuse
3. **SQL Injection**: Parameterized queries used
4. **XSS Prevention**: Base64 data sanitized
5. **Access Control**: Add authentication in production

## Future Enhancements

Potential improvements:

- [ ] Image compression on server side
- [ ] Multiple photos per employee
- [ ] Photo cropping tool
- [ ] Integration with cloud storage (S3, Azure Blob)
- [ ] Photo versioning/history
- [ ] Bulk photo upload
- [ ] Photo search by face recognition
- [ ] Automatic thumbnail generation

## Support

For issues related to photo storage:
1. Check file size (<5MB)
2. Verify image format is valid
3. Check database LONGTEXT field exists
4. Review server logs for errors
5. Test with smaller images first

## License

MIT License - Part of Company Management System
