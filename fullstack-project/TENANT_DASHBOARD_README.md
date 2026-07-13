# Tenant Dashboard Implementation Guide

## Overview

The Tenant Dashboard is a comprehensive web application module that provides tenants with full control and visibility over their apartment, maintenance, payments, complaints, and community features.

## Features Implemented

### 1. **Dashboard** (`/tenant/dashboard`)
- **Pending Bills Card**: Displays current and overdue bills
- **Visitors Today Card**: Shows active visitors in the society
- **Open Complaints Card**: Displays tenant's open complaints
- **Upcoming Events Card**: Shows community events
- **Quick Actions Panel**: One-click access to common tasks
- **Recent Activity Timeline**: Shows account activity

### 2. **My Residence** (`/tenant/residence`)
- Display apartment details (Society name, Tower, Wing, Floor, Flat number)
- Lease information (Start date, End date)
- Occupancy status
- View Details button
- Download Agreement function
- View Residence Information function

### 3. **Family Members** (`/tenant/family-members`)
- Add new family members
- Edit family member details
- Delete family members
- Search family members by name or relation
- Validation of input fields

### 4. **Visitors** (`/tenant/visitors`)
- Add new visitor entries
- Approve/Reject visitor requests
- Generate QR codes for visitor passes
- View visitor history
- Display visitor status (Pending, Approved, Rejected)

### 5. **Payments** (`/tenant/billing`)
- View all bills and invoices
- Pay maintenance bills
- Download payment receipts
- View payment history
- Filter bills by status and date

### 6. **Complaints** (`/tenant/complaints`)
- Create new complaints
- Upload attachments
- Track complaint status in real-time
- View status updates
- Close resolved complaints
- Comment on complaints

### 7. **Documents** (`/tenant/documents`)
- Upload documents (agreements, receipts, etc.)
- Download documents
- Preview documents
- Delete documents
- Organize documents in folders

### 8. **Amenities** (`/tenant/amenities`)
- Browse all available amenities
- View availability and slot information
- Book amenities with date/time selection
- Cancel bookings
- View booking history
- Visual representation of slot availability

### 9. **Parking** (`/tenant/parking`)
- View assigned parking slot
- Register vehicles (Car, Motorcycle, Scooter)
- Edit vehicle information
- Remove vehicles
- View parking slot details

### 10. **Community** (`/tenant/community`)
- **Notices**: Read society announcements and alerts
- **Events**: View upcoming events and register
- **Polls**: Participate in community voting
- **Surveys**: Complete community surveys

### 11. **Settings** (`/tenant/settings`)
- **Profile Settings**: Update name, email, phone
- **Change Password**: Update account password
- **Notification Preferences**: Control notification types
- **Language Preferences**: Select preferred language

## Sidebar Navigation Structure

```
├── Dashboard
├── My Residence
├── Family Members
├── Visitors
├── 💳 Payments
├── 📝 Complaints
├── 📄 Documents
├── 🎯 Amenities
├── 🚗 Parking
├── 👥 Community
└── ⚙️ Settings
```

## Responsiveness Support

The dashboard is fully responsive across all major breakpoints:

### Breakpoints Tested
- **1920px**: Large Desktop - 4 column layout
- **1440px**: Large Desktop - 3 column layout
- **1366px**: Laptop - 2 column layout
- **1024px**: Tablet Large - 2 column layout
- **768px**: Tablet - 1 column layout with hamburger menu
- **480px**: Mobile - Single column, touch-optimized
- **375px**: Small Mobile - Compact single column

### Responsive Features
- Collapsible sidebar on tablets and mobile
- Touch-friendly button sizes (44px minimum)
- Responsive table layouts with horizontal scroll
- Adaptive grid layouts
- Mobile-first CSS approach
- Hamburger menu navigation on mobile

## Permission Control

### Tenant Access Restrictions

Tenants are **explicitly prevented** from accessing:
- `/admin` - Society Administration
- `/chairman` - Chairman Dashboard
- `/secretary` - Secretary Dashboard
- `/security-dashboard` - Security Operations
- `/accountant` - Financial Admin
- `/staff` - Staff Management
- `/super-admin` - Platform Admin

### Access Denial Behavior
- Attempting unauthorized access displays "Access Denied" page
- Session is validated on every route
- Role-based access control is enforced
- Unauthorized routes are inaccessible

## API Integration Points

The following API endpoints need to be implemented/integrated:

### Dashboard APIs
```
GET /api/tenant/dashboard/pending-bills
GET /api/tenant/dashboard/visitors-today
GET /api/tenant/dashboard/open-complaints
GET /api/tenant/dashboard/upcoming-events
GET /api/tenant/dashboard/activity-timeline
```

### Residence APIs
```
GET /api/tenant/residence/details
GET /api/tenant/residence/lease-info
POST /api/tenant/residence/download-agreement
```

### Family Members APIs
```
GET /api/tenant/family-members
POST /api/tenant/family-members
PUT /api/tenant/family-members/{id}
DELETE /api/tenant/family-members/{id}
GET /api/tenant/family-members/search?q={query}
```

### Visitors APIs
```
GET /api/tenant/visitors
POST /api/tenant/visitors
PATCH /api/tenant/visitors/{id}/approve
PATCH /api/tenant/visitors/{id}/reject
POST /api/tenant/visitors/{id}/generate-qr
GET /api/tenant/visitors/history
```

### Payments APIs
```
GET /api/tenant/bills
GET /api/tenant/bills/{id}
POST /api/tenant/bills/{id}/pay
GET /api/tenant/bills/{id}/receipt
GET /api/tenant/payments/history
```

### Complaints APIs
```
GET /api/tenant/complaints
POST /api/tenant/complaints
GET /api/tenant/complaints/{id}
POST /api/tenant/complaints/{id}/comment
PATCH /api/tenant/complaints/{id}/status
POST /api/tenant/complaints/{id}/attachments
```

### Documents APIs
```
GET /api/tenant/documents
POST /api/tenant/documents
GET /api/tenant/documents/{id}/download
DELETE /api/tenant/documents/{id}
GET /api/tenant/documents/{id}/preview
```

### Amenities APIs
```
GET /api/tenant/amenities
GET /api/tenant/amenities/{id}/availability
POST /api/tenant/amenities/{id}/book
DELETE /api/tenant/amenities/{id}/booking/{bookingId}
GET /api/tenant/amenities/bookings/history
```

### Parking APIs
```
GET /api/tenant/parking/slot
POST /api/tenant/parking/vehicles
PUT /api/tenant/parking/vehicles/{id}
DELETE /api/tenant/parking/vehicles/{id}
```

### Community APIs
```
GET /api/tenant/community/notices
GET /api/tenant/community/events
POST /api/tenant/community/events/{id}/register
GET /api/tenant/community/polls
POST /api/tenant/community/polls/{id}/vote
GET /api/tenant/community/surveys
```

### Settings APIs
```
GET /api/tenant/profile
PUT /api/tenant/profile
POST /api/tenant/change-password
PUT /api/tenant/notification-preferences
PUT /api/tenant/language-preferences
```

## File Structure

```
frontend/src/
├── pages/
│   ├── tenant/
│   │   ├── TenantMainDashboard.jsx
│   │   ├── TenantResidence.jsx
│   │   ├── TenantFamilyMembers.jsx
│   │   ├── TenantVisitors.jsx
│   │   ├── TenantAmenities.jsx
│   │   ├── TenantParking.jsx
│   │   ├── TenantCommunity.jsx
│   │   └── TenantSettings.jsx
│   ├── TenantDashboardPage.jsx
│   └── ResidentDashboardRouterPage.jsx
├── components/
│   ├── DashboardLayout.jsx
│   ├── Sidebar.jsx
│   ├── TopNavbar.jsx
│   └── TenantProtectedRoute.jsx
├── hooks/
│   └── useTenantAccess.js
├── styles/
│   └── tenant-dashboard-responsive.css
└── App.jsx
```

## Usage

### Login as Tenant
1. Navigate to `/login`
2. Enter tenant credentials
3. System automatically redirects to `/tenant/dashboard`

### Access Tenant Routes
- All tenant routes start with `/tenant/`
- Sidebar navigation is available for all sub-routes
- Responsive layout adapts to screen size

### Switch Between Sections
- Click sidebar menu items to navigate
- Each section maintains its own state
- Data persists during session

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations

1. **Code Splitting**: Tenant pages are lazy-loaded
2. **Image Optimization**: All images are optimized
3. **CSS**: Responsive CSS is optimized for each breakpoint
4. **State Management**: React hooks for efficient state
5. **Memoization**: Components use React.memo where applicable

## Error Handling

- Network errors show user-friendly messages
- Form validation prevents invalid submissions
- Session timeout redirects to login
- API errors are logged to console
- Fallback UI for loading states

## Future Enhancements

1. Real-time notifications
2. Push notifications
3. Offline support
4. Progressive Web App (PWA)
5. Dark mode optimization
6. Accessibility improvements (WCAG 2.1)
7. Multi-language support expansion
8. Mobile app integration

## Troubleshooting

### Tenant cannot access dashboard
- Verify resident_type is set to "tenant" in database
- Check authentication token validity
- Clear browser cache and try again

### Missing API data
- Ensure backend APIs are implemented
- Check API endpoints in network tab
- Verify CORS settings if cross-origin

### Responsive issues
- Test at exact breakpoints (375, 480, 768, 1024, 1366, 1440, 1920)
- Check browser zoom level (should be 100%)
- Verify no CSS conflicts from browser extensions

## Support

For issues or questions about the Tenant Dashboard:
1. Check the implementation guide
2. Review API endpoints
3. Contact development team
4. Submit bug reports with reproduction steps
