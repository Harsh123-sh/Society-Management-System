# Quick Setup Guide - Visitor Photo Capture

## 🚀 Installation & Configuration

### Step 1: Get Cloudinary Credentials
1. Visit https://cloudinary.com/users/register/free
2. Sign up for free account
3. Go to Dashboard
4. Note: Cloud Name, API Key, API Secret

### Step 2: Update Backend Environment
Edit `backend/.env`:
```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### Step 3: Install Dependencies

**Backend:**
```bash
cd backend
npm install cloudinary
npm install  # Install all dependencies
```

**Frontend:**
```bash
cd frontend
npm install react-webcam
npm install  # Install all dependencies
```

### Step 4: Update Database
Run this SQL to add photo column:
```sql
USE fullstack_db;
ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) NULL;
```

Or let the schema.sql run automatically on next startup.

---

## ✅ Testing the Feature

### Test Steps:
1. Start backend: `npm run dev` (from backend folder)
2. Start frontend: `npm run dev` (from frontend folder)
3. Login as security/admin user
4. Go to Visitors page
5. Click "📷 Capture Photo"
6. Grant camera permission
7. Click "📸 Capture Photo"
8. Fill in visitor details
9. Click "Add Entry"
10. Check visitor logs - photo should appear

---

## 📋 API Testing with cURL/Postman

### Endpoint: POST /api/visitors

**With Photo:**
```bash
curl -X POST http://localhost:5000/api/visitors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "visitorName": "Test Visitor",
    "phone": "9876543210",
    "purpose": "Delivery",
    "personToMeet": "Resident",
    "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
  }'
```

**Without Photo (backwards compatible):**
```bash
curl -X POST http://localhost:5000/api/visitors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "visitorName": "Test Visitor",
    "phone": "9876543210",
    "purpose": "Delivery"
  }'
```

---

## 🔧 Component Usage

### CameraCapture Component

**Import:**
```javascript
import CameraCapture from "../components/CameraCapture";
```

**Usage:**
```javascript
const [showCamera, setShowCamera] = useState(false);
const [photo, setPhoto] = useState(null);

function handlePhotoCapture(base64Image) {
  setPhoto(base64Image);
  setShowCamera(false);
}

// In JSX:
{showCamera && (
  <CameraCapture
    onCapture={handlePhotoCapture}
    onClose={() => setShowCamera(false)}
  />
)}

// Display preview:
{photo && <img src={photo} alt="preview" />}
```

---

## 📦 File Structure

```
fullstack-project/
├── backend/
│   ├── utils/
│   │   └── cloudinary.js ← NEW
│   ├── controllers/
│   │   └── visitorController.js (UPDATED)
│   ├── models/
│   │   └── visitorModel.js (UPDATED)
│   ├── database/
│   │   └── schema.sql (UPDATED)
│   ├── .env (UPDATED with Cloudinary keys)
│   └── package.json (UPDATED)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── CameraCapture.jsx ← NEW
    │   ├── pages/
    │   │   └── VisitorsPage.jsx (UPDATED)
    │   └── services/
    │       └── visitorApi.js (UPDATED)
    └── package.json (UPDATED)
```

---

## 🎯 Key Features Implemented

✅ **Live Camera Access** - Opens device camera in modal  
✅ **Photo Capture** - Captures JPEG image as base64  
✅ **Cloudinary Integration** - Uploads to cloud storage  
✅ **Database Storage** - Saves URL with visitor  
✅ **Photo Display** - Shows thumbnail in logs  
✅ **Error Handling** - Permission & upload errors  
✅ **Mobile Friendly** - Works on iOS/Android  
✅ **Backwards Compatible** - Photos remain optional  

---

## 🐛 Common Issues & Fixes

### Issue: Camera not opening
```
Error: Permission denied
```
**Fix:**
- Check browser camera permissions
- Use HTTPS (Chrome requires it)
- Localhost works without HTTPS

### Issue: Cloudinary error
```
Error: Invalid Cloudinary config
```
**Fix:**
- Verify .env has correct credentials
- Restart backend server after .env changes
- Check Cloudinary account is active

### Issue: Photo not saved
```
photo_url is NULL in database
```
**Fix:**
- Run ALTER TABLE command for schema update
- Check file permissions for database
- Verify no SQL errors in backend logs

### Issue: Large payload
```
Error: Payload too large
```
**Fix:**
- Backend limits can be increased in App.js:
```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
```

---

## 📊 Cloudinary Tips

### View Uploaded Photos:
1. Login to Cloudinary Dashboard
2. Go to Media Library
3. Click "visitor_photos" folder
4. See all uploaded visitor photos

### Optimize Images:
In `cloudinary.js`, the configuration already includes:
```javascript
quality: "auto"      // Auto-optimized quality
fetch_format: "auto" // Best format for browser
```

### Storage Limits:
Free tier includes:
- 25GB storage
- Unlimited transformations
- Perfect for this use case

---

## 🔐 Security Notes

1. **JWT Authentication Required** - Visitor API needs valid token
2. **Role-Based Access** - Only security/admin can add visitors
3. **HTTPS Recommended** - Camera access on production
4. **Image Validation** - Base64 validated before upload
5. **Cloudinary URL Secure** - Uses HTTPS URLs from Cloudinary

---

## 📱 Browser Permissions

Users will see permission dialog:

```
"localhost" would like to access your camera
[Block] [Allow]
```

### For Different Browsers:

**Chrome/Edge:**
- Settings → Privacy and security → Site settings → Camera
- Allow localhost for testing

**Firefox:**
- about:preferences → Privacy → Permissions → Camera
- Allow localhost

**Safari (iOS):**
- Settings → Websites → Camera
- Allow for site

---

## 🔄 Data Flow Summary

1. **Security adds visitor** → Opens form
2. **Clicks "Capture Photo"** → CameraCapture modal opens
3. **Takes photo** → Returns base64 image
4. **Submits form** → POST /api/visitors with photoBase64
5. **Backend uploads** → Sends base64 to Cloudinary
6. **Cloudinary returns** → secure_url
7. **Save to DB** → Store photo_url with visitor
8. **Display in logs** → Show photo thumbnail

---

## 🎓 Learning Resources

- **react-webcam**: https://github.com/mozmorris/react-webcam
- **Cloudinary API**: https://cloudinary.com/documentation/upload_widget
- **Base64 Images**: MDN Web Docs - Base64 encoding
- **JWT Auth**: https://jwt.io/

---

## 📞 Support

If issues arise:
1. Check backend logs: `npm run dev` output
2. Check browser console: F12 → Console tab
3. Verify Cloudinary credentials
4. Check database for photo_url column
5. Verify JWT token is valid

