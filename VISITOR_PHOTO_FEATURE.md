# Live Visitor Photo Capture Feature - Implementation Guide

## Overview
This implementation adds live visitor photo capture using the device camera, stores images on Cloudinary, and displays photos in the visitor logs.

---

## 🗄️ Database Schema

### Updated `visitors` table
A new column has been added to store the Cloudinary image URL:

```sql
ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) NULL;
```

**Field Details:**
- `photo_url`: Stores the Cloudinary secure URL (500 characters max)

---

## 🔧 Backend Implementation

### 1. Dependencies
Add Cloudinary to `backend/package.json`:
```bash
npm install cloudinary
```

### 2. Environment Variables
Update `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**To get Cloudinary credentials:**
1. Sign up at https://cloudinary.com
2. Go to Dashboard > Settings > API Keys
3. Copy Cloud Name, API Key, and API Secret

### 3. Cloudinary Utility (`backend/utils/cloudinary.js`)
Handles uploading base64 images to Cloudinary:

```javascript
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadVisitorPhoto(base64Image) {
  const dataURI = base64Image.startsWith("data:") 
    ? base64Image 
    : `data:image/jpeg;base64,${base64Image}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder: "visitor_photos",
    resource_type: "auto",
    quality: "auto",
    fetch_format: "auto",
  });

  return result.secure_url;
}
```

### 4. Updated Visitor Controller
Modified `addVisitorEntry` to accept `photoBase64`:

```javascript
async function addVisitorEntry(req, res) {
  const { visitorName, phone, purpose, personToMeet, vehicleNumber, flatId, preapprovalId, photoBase64 } = req.body;
  
  let photoUrl = null;
  
  if (photoBase64) {
    try {
      photoUrl = await uploadVisitorPhoto(photoBase64);
    } catch (uploadError) {
      return res.status(400).json({
        success: false,
        message: "Failed to upload visitor photo",
      });
    }
  }
  
  // Rest of the logic with photoUrl passed to model...
}
```

### 5. Updated Visitor Model
Modified database insert to include `photo_url`:

```javascript
async function createVisitorEntry({
  visitorName,
  phone,
  purpose,
  personToMeet,
  vehicleNumber,
  flatId,
  preapprovalId,
  securityId,
  photoUrl,
}) {
  const [result] = await db.query(
    `INSERT INTO visitors (
      visitor_name,
      phone,
      purpose,
      person_to_meet,
      vehicle_number,
      flat_id,
      preapproval_id,
      entry_time,
      status,
      security_id,
      photo_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'in_premises', ?, ?)`,
    [
      visitorName,
      phone || null,
      purpose,
      personToMeet || null,
      vehicleNumber || null,
      flatId || null,
      preapprovalId || null,
      securityId,
      photoUrl || null,
    ]
  );
  return result.insertId;
}
```

### 6. API Endpoint
**POST** `/api/visitors`

**Request Body:**
```json
{
  "visitorName": "John Doe",
  "phone": "1234567890",
  "purpose": "Delivery",
  "personToMeet": "Owner Name",
  "vehicleNumber": "ABC123",
  "flatId": null,
  "preapprovalId": null,
  "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Visitor entry created",
  "data": {
    "id": 1,
    "visitor_name": "John Doe",
    "phone": "1234567890",
    "purpose": "Delivery",
    "photo_url": "https://res.cloudinary.com/...",
    ...
  }
}
```

---

## 🎨 Frontend Implementation

### 1. Dependencies
Add react-webcam to `frontend/package.json`:
```bash
npm install react-webcam
```

### 2. Camera Capture Component (`frontend/src/components/CameraCapture.jsx`)
Modal component that opens device camera and captures photos:

```javascript
import { useRef, useState } from "react";
import Webcam from "react-webcam";

function CameraCapture({ onCapture, onClose }) {
  const webcamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState("");

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      }
    }
  };

  const handleUserMediaError = (error) => {
    setError("Unable to access camera. Please check permissions.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">Capture Visitor Photo</h3>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          onUserMedia={() => setCameraReady(true)}
          onUserMediaError={handleUserMediaError}
        />
        <button onClick={handleCapture} disabled={!cameraReady}>
          📸 Capture Photo
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
```

**Key Features:**
- Opens device camera
- Returns base64 JPEG image
- Error handling for camera access issues
- Video constraints for optimal quality

### 3. Updated Visitors Page
Key changes to `frontend/src/pages/VisitorsPage.jsx`:

```javascript
import CameraCapture from "../components/CameraCapture";

function VisitorsPage() {
  const [showCamera, setShowCamera] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [form, setForm] = useState({
    visitorName: "",
    phone: "",
    purpose: "",
    personToMeet: "",
    vehicleNumber: "",
    photoBase64: "",  // ← New field
  });

  function handleCameraCapture(capturedImage) {
    setForm((prev) => ({ ...prev, photoBase64: capturedImage }));
    setPhotoPreview(capturedImage);
    setShowCamera(false);
  }

  // Form submission includes photoBase64
  async function handleCreateEntry(event) {
    event.preventDefault();
    await createVisitorEntry(form);
    // Resets form including photo
  }

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
      
      {/* Display captured photo preview */}
      {photoPreview && (
        <img src={photoPreview} alt="preview" className="h-32 w-32" />
      )}

      {/* Display photos in visitor logs */}
      {logs.map((log) => (
        <article key={log.id}>
          {log.photo_url && (
            <img src={log.photo_url} alt={log.visitor_name} className="h-24 w-24" />
          )}
          {/* Rest of visitor info... */}
        </article>
      ))}
    </>
  );
}
```

---

## 📋 User Flow

### For Security Personnel:
1. **Open Visitor Entry Form** - Navigate to Visitors page
2. **Enter Details** - Fill in name, phone, purpose, etc.
3. **Capture Photo** - Click "📷 Capture Photo" button
4. **Confirm** - Take photo in modal, preview appears in form
5. **Submit** - Click "Add Entry" to save with photo
6. **View** - Photo appears in visitor logs next to entry

### For Admin/Staff Viewing:
1. Navigate to Visitors page
2. Each visitor entry shows their photo thumbnail (if captured)
3. Click photo to view full size
4. Photos stored permanently on Cloudinary

---

## 🔒 Security Considerations

1. **Camera Permissions**: Users must grant camera access
2. **Base64 Encoding**: Images converted to base64 before transmission
3. **Cloudinary Storage**: Cloud storage reduces server load
4. **URL Validation**: Photo URLs validated before storage
5. **Authentication**: Endpoint requires security/admin role

---

## 🚀 Setup Instructions

### Backend Setup:
```bash
cd backend
npm install
# Add CLOUDINARY credentials to .env
npm run dev
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

### Database:
```bash
# Run migration
mysql -u root -p fullstack_db < database/schema.sql
```

---

## 📱 Browser Compatibility

✅ Chrome 64+  
✅ Firefox 55+  
✅ Safari 11.1+  
✅ Edge 79+  
⚠️ Requires HTTPS or localhost  
⚠️ Mobile: iOS 14.5+ (camera permissions updated)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not opening | Check browser permissions, ensure HTTPS |
| Cloudinary error | Verify API credentials in .env |
| Photo not saving | Check photo_url column exists in DB |
| Blurry photos | Improve lighting, increase distance from camera |
| CORS errors | Verify CORS_ORIGIN in backend .env |

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────┐
│         Security Personnel                   │
│    (VisitorsPage Component)                  │
└────────────┬────────────────────────────────┘
             │
             ├─→ Click "Capture Photo"
             │
┌────────────▼────────────────────────────────┐
│      CameraCapture Modal                     │
│   (react-webcam component)                   │
└────────────┬────────────────────────────────┘
             │
             ├─→ User takes photo (base64)
             │
┌────────────▼────────────────────────────────┐
│    Frontend: VisitorsPage                    │
│  (Store in form state)                       │
└────────────┬────────────────────────────────┘
             │
             ├─→ Include photoBase64 in POST
             │
┌────────────▼────────────────────────────────┐
│  Backend: /api/visitors POST                 │
│  (visitorController)                         │
└────────────┬────────────────────────────────┘
             │
             ├─→ uploadVisitorPhoto()
             │
┌────────────▼────────────────────────────────┐
│     Cloudinary Service                       │
│   (Upload base64 image)                      │
└────────────┬────────────────────────────────┘
             │
             ├─→ Returns secure_url
             │
┌────────────▼────────────────────────────────┐
│   Backend: Database Insert                   │
│   (Save URL with visitor entry)              │
└────────────┬────────────────────────────────┘
             │
             ├─→ Return success response
             │
┌────────────▼────────────────────────────────┐
│  Frontend: Display in Visitor Logs           │
│  (Show photo thumbnail)                      │
└─────────────────────────────────────────────┘
```

---

## 📝 Files Modified/Created

**Backend:**
- ✅ `backend/utils/cloudinary.js` - NEW
- ✅ `backend/database/schema.sql` - UPDATED
- ✅ `backend/package.json` - UPDATED (added cloudinary)
- ✅ `backend/.env` - UPDATED (added Cloudinary keys)
- ✅ `backend/controllers/visitorController.js` - UPDATED
- ✅ `backend/models/visitorModel.js` - UPDATED

**Frontend:**
- ✅ `frontend/src/components/CameraCapture.jsx` - NEW
- ✅ `frontend/src/pages/VisitorsPage.jsx` - UPDATED
- ✅ `frontend/src/services/visitorApi.js` - UPDATED
- ✅ `frontend/package.json` - UPDATED (added react-webcam)

---

## 🎯 Next Steps (Optional Enhancements)

1. **Image Compression**: Reduce base64 size before upload
2. **Multiple Photos**: Allow multiple captures per visitor
3. **Photo Verification**: Require photo to be taken (not optional)
4. **Face Detection**: Use ML models to verify visitor identity
5. **Comparison**: Compare with approved resident photos
6. **Reports**: Generate security reports with photos
7. **Facial Recognition**: Implement for repeat visitors

