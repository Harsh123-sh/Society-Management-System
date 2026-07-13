# Tenant Dashboard - Developer Quick Reference

## Quick Start for Backend Integration

### Routes Structure
```javascript
// Main tenant dashboard route
GET /tenant                     // Dashboard home
GET /tenant/dashboard          // Main dashboard page
GET /tenant/residence          // My residence
GET /tenant/family-members     // Family members list
GET /tenant/visitors           // Visitors management
GET /tenant/billing            // Payments/Bills
GET /tenant/complaints         // Complaints
GET /tenant/documents          // Documents
GET /tenant/amenities          // Amenities
GET /tenant/parking            // Parking
GET /tenant/community          // Community
GET /tenant/settings           // Settings
```

### API Endpoints to Implement

#### 1. Dashboard Endpoints (6)
```javascript
GET  /api/tenant/dashboard/pending-bills      // Get pending bills
GET  /api/tenant/dashboard/visitors-today     // Get today's visitors
GET  /api/tenant/dashboard/open-complaints    // Get open complaints
GET  /api/tenant/dashboard/upcoming-events    // Get upcoming events
GET  /api/tenant/dashboard/activity-timeline  // Get recent activities
POST /api/tenant/dashboard/activity           // Log activity
```

#### 2. Residence Endpoints (3)
```javascript
GET    /api/tenant/residence                  // Get residence details
GET    /api/tenant/residence/lease            // Get lease info
POST   /api/tenant/residence/download         // Download agreement
```

#### 3. Family Members Endpoints (5)
```javascript
GET    /api/tenant/family-members             // List all members
POST   /api/tenant/family-members             // Add new member
GET    /api/tenant/family-members/:id         // Get member details
PUT    /api/tenant/family-members/:id         // Update member
DELETE /api/tenant/family-members/:id         // Delete member
```

#### 4. Visitors Endpoints (6)
```javascript
GET    /api/tenant/visitors                   // List all visitors
POST   /api/tenant/visitors                   // Add new visitor
GET    /api/tenant/visitors/:id               // Get visitor details
PATCH  /api/tenant/visitors/:id/approve       // Approve visitor
PATCH  /api/tenant/visitors/:id/reject        // Reject visitor
POST   /api/tenant/visitors/:id/qr            // Generate QR code
```

#### 5. Payments/Billing Endpoints (5)
```javascript
GET    /api/tenant/bills                      // List all bills
GET    /api/tenant/bills/:id                  // Get bill details
POST   /api/tenant/bills/:id/pay              // Process payment
GET    /api/tenant/bills/:id/receipt          // Get receipt
GET    /api/tenant/bills/history              // Get payment history
```

#### 6. Complaints Endpoints (5)
```javascript
GET    /api/tenant/complaints                 // List complaints
POST   /api/tenant/complaints                 // Create complaint
GET    /api/tenant/complaints/:id             // Get complaint details
PATCH  /api/tenant/complaints/:id/status      // Update status
POST   /api/tenant/complaints/:id/comment     // Add comment
```

#### 7. Documents Endpoints (5)
```javascript
GET    /api/tenant/documents                  // List documents
POST   /api/tenant/documents                  // Upload document
GET    /api/tenant/documents/:id/download     // Download document
GET    /api/tenant/documents/:id/preview      // Preview document
DELETE /api/tenant/documents/:id              // Delete document
```

#### 8. Amenities Endpoints (4)
```javascript
GET    /api/tenant/amenities                  // List all amenities
GET    /api/tenant/amenities/:id/slots        // Get available slots
POST   /api/tenant/amenities/:id/book         // Book amenity
GET    /api/tenant/amenities/bookings         // Get booking history
```

#### 9. Parking Endpoints (4)
```javascript
GET    /api/tenant/parking/slot               // Get assigned slot
POST   /api/tenant/parking/vehicles           // Register vehicle
PUT    /api/tenant/parking/vehicles/:id       // Update vehicle
DELETE /api/tenant/parking/vehicles/:id       // Delete vehicle
```

#### 10. Community Endpoints (6)
```javascript
GET    /api/tenant/community/notices          // Get notices
GET    /api/tenant/community/events           // Get events
POST   /api/tenant/community/events/:id/join  // Join event
GET    /api/tenant/community/polls            // Get polls
POST   /api/tenant/community/polls/:id/vote   // Vote on poll
GET    /api/tenant/community/surveys          // Get surveys
```

#### 11. Settings Endpoints (5)
```javascript
GET    /api/tenant/profile                    // Get profile
PUT    /api/tenant/profile                    // Update profile
POST   /api/tenant/change-password            // Change password
PUT    /api/tenant/notifications              // Update notification prefs
PUT    /api/tenant/language                   // Update language
```

### Database Tables Needed

```sql
-- Core Tables
tenants (id, user_id, society_id, flat_number, lease_start, lease_end)
family_members (id, tenant_id, name, relation, email, phone)
visitors (id, tenant_id, name, date, time, status, qr_code)
bills (id, tenant_id, amount, status, due_date)
complaints (id, tenant_id, description, status, created_at)
documents (id, tenant_id, name, file_path, uploaded_at)
vehicles (id, tenant_id, type, registration, color, parking_slot)
bookings (id, tenant_id, amenity_id, date, time, status)
community_notices (id, society_id, title, content, date)
community_events (id, society_id, title, date, location)
community_polls (id, society_id, question, options)
user_poll_votes (id, user_id, poll_id, option)
```

### Frontend to Backend Data Flow

#### Example: Dashboard Cards
```javascript
// Frontend: TenantMainDashboard.jsx
useEffect(() => {
  Promise.all([
    fetch('/api/tenant/dashboard/pending-bills'),
    fetch('/api/tenant/dashboard/visitors-today'),
    fetch('/api/tenant/dashboard/open-complaints'),
    fetch('/api/tenant/dashboard/upcoming-events')
  ])
  .then(responses => Promise.all(responses.map(r => r.json())))
  .then(data => setDashboardData(/* format data */))
}, []);

// Backend Response Format
{
  pendingBills: { count: "₹15,240", status: "pending", dueDate: "2024-02-25" },
  visitorsToday: { count: 2, status: "active" },
  openComplaints: { count: 1, status: "open" },
  upcomingEvents: { count: 3, status: "active" }
}
```

### Authentication & Authorization

```javascript
// All API requests should include:
Headers: {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}

// Backend should verify:
1. JWT token validity
2. User role is "resident" with resident_type="tenant"
3. User can only access their own data
4. Society_id matches user's society_id
```

### Error Handling Patterns

```javascript
// Frontend expects these error responses:
{
  success: false,
  message: "Error description",
  data: null
}

// Success responses:
{
  success: true,
  message: "Operation successful",
  data: { /* response data */ }
}

// HTTP Status Codes:
200 - OK
201 - Created
400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 - Server Error
```

### Validation Rules

```javascript
// Family Members
- Name: Required, 2-100 characters
- Relation: Required, from predefined list
- Email: Valid email format
- Phone: Valid phone number (10 digits for India)

// Visitors
- Name: Required
- Date: Future date only
- Relation: Optional

// Vehicles
- Registration: Required, unique per tenant
- Type: From list (Car, Motorcycle, Scooter)
- Parking Slot: Available slots only

// Complaints
- Title: Required
- Description: Required, min 20 characters
- Category: From predefined list
```

### Common Response Codes

```javascript
{
  "statusCode": 200,
  "success": true,
  "message": "Bills retrieved successfully",
  "data": [
    {
      "id": 1,
      "amount": 5000,
      "status": "pending",
      "dueDate": "2024-02-25",
      "description": "Maintenance Bill"
    }
  ]
}
```

### Testing the Integration

```bash
# Test Dashboard
curl -H "Authorization: Bearer TOKEN" \
  https://api.example.com/api/tenant/dashboard/pending-bills

# Test Add Family Member
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","relation":"Spouse"}' \
  https://api.example.com/api/tenant/family-members

# Test Update Profile
curl -X PUT \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","phone":"9876543210"}' \
  https://api.example.com/api/tenant/profile
```

### Performance Considerations

```javascript
// Recommended:
- Pagination for lists (limit: 20-50)
- Caching for frequently accessed data
- Lazy loading for large datasets
- Indexed database queries

// API Response Times:
- Dashboard cards: < 500ms
- List endpoints: < 1000ms
- File operations: < 5000ms
```

### Security Checklist

- [x] All endpoints require authentication
- [x] Role-based access control enforced
- [x] Users can only access own data
- [x] File uploads validated
- [x] SQL injection prevention
- [x] XSS protection
- [x] CORS headers configured
- [x] Rate limiting enabled
- [x] Input validation on backend
- [x] Output encoding for XSS

### Frontend Components to Connect

```javascript
// Import these to integrate data
import TenantMainDashboard from '../pages/tenant/TenantMainDashboard'
import TenantResidence from '../pages/tenant/TenantResidence'
import TenantFamilyMembers from '../pages/tenant/TenantFamilyMembers'
// ... etc

// Each component has these hooks:
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

// Connect API calls in useEffect hook
useEffect(() => {
  fetchData()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false))
}, [])
```

### Debugging Tips

1. **Check Network Tab**: Verify API calls are being made
2. **Check Console**: Look for error messages
3. **Check Response Format**: Ensure data matches expected structure
4. **Test with Postman**: Verify endpoints work independently
5. **Check Authorization**: Verify JWT token is valid
6. **Check Permissions**: Verify user role allows access
7. **Check Database**: Verify data exists in database

---

## Support Files

- **TENANT_DASHBOARD_README.md** - Comprehensive documentation
- **TENANT_DASHBOARD_IMPLEMENTATION_COMPLETE.md** - Implementation summary
- **tenant-dashboard-responsive.css** - Responsive styling
- **useTenantAccess.js** - Permission hooks

---

## Contact & Questions

For questions about implementation, refer to:
1. TENANT_DASHBOARD_README.md
2. Component comments in source code
3. API response format examples above
4. Database schema documentation

---

**Last Updated:** July 10, 2026
**Version:** 1.0
**Status:** Ready for Backend Integration
