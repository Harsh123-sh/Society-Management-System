# Multi-Builder Multi-Society SaaS Architecture

## System Hierarchy
```
Super Admin (Platform Owner)
  ├─ Builder Admin (Manages multiple societies)
  │  ├─ Society Admin
  │  │  ├─ Owner (Owns flat/property)
  │  │  ├─ Tenant (Rents flat)
  │  │  ├─ Staff (Maintenance, management)
  │  │  └─ Security (Gate, visitor management)
  │  └─ Analytics & Insights
  └─ Billing & Subscriptions
```

## Database Schema Changes

### Core Multi-Tenant Tables
All tables now support `builder_id` and `society_id` for isolation.

#### 1. Builders Table (NEW)
```sql
CREATE TABLE builders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url VARCHAR(500),
  website VARCHAR(200),
  status ENUM('active', 'suspended', 'trial') DEFAULT 'trial',
  subscription_plan VARCHAR(50) DEFAULT 'starter',
  max_societies INT DEFAULT 10,
  max_users INT DEFAULT 1000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Updated Societies Table
- Add `builder_id` foreign key
- Add `subscription_tier` (starter, professional, enterprise)
- Add `configured_at` (when setup wizard completed)

#### 3. Dynamic Structure Tables (NEW)
```sql
-- Towers/Buildings
CREATE TABLE towers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  society_id INT NOT NULL,
  builder_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,  -- Tower A, Building 1, etc
  code VARCHAR(60),
  total_floors INT,
  created_at TIMESTAMP,
  UNIQUE (society_id, builder_id, code)
);

-- Wings (part of towers or standalone)
CREATE TABLE wings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  society_id INT NOT NULL,
  builder_id INT NOT NULL,
  tower_id INT,  -- NULL if wing is standalone
  name VARCHAR(120) NOT NULL,  -- Wing A, West, etc
  code VARCHAR(60),
  created_at TIMESTAMP,
  UNIQUE (society_id, tower_id, code)
);

-- Blocks (sub-division of wings)
CREATE TABLE blocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  society_id INT NOT NULL,
  builder_id INT NOT NULL,
  wing_id INT NOT NULL,
  name VARCHAR(120),
  code VARCHAR(60),
  created_at TIMESTAMP,
  UNIQUE (society_id, wing_id, code)
);

-- Floors (per wing or block)
CREATE TABLE floors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  society_id INT NOT NULL,
  builder_id INT NOT NULL,
  wing_id INT NOT NULL,
  floor_number INT,
  floor_name VARCHAR(60),  -- Ground, 1, 2, etc
  total_units INT,
  created_at TIMESTAMP,
  UNIQUE (society_id, wing_id, floor_number)
);

-- Flats (updated with better hierarchy)
CREATE TABLE flats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  society_id INT NOT NULL,
  builder_id INT NOT NULL,
  tower_id INT,
  wing_id INT,
  block_id INT,
  floor_id INT,
  flat_number VARCHAR(50) NOT NULL,
  flat_type ENUM('1BHK', '2BHK', '3BHK', '4BHK', 'Studio', 'Penthouse'),
  carpet_area DECIMAL(10,2),
  builtup_area DECIMAL(10,2),
  status ENUM('vacant', 'occupied', 'under_maintenance'),
  approval_status ENUM('pending', 'approved'),
  created_at TIMESTAMP,
  UNIQUE (society_id, builder_id, flat_number),
  KEY (society_id, builder_id, wing_id, floor_id)
);
```

#### 4. Users Table Updates
- Add `builder_id` (for builder admins)
- Add `society_id` (for society members)
- Add `role` hierarchy: super_admin, builder_admin, society_admin, owner, tenant, staff, security
- Add `permissions_json` (custom permissions)

#### 5. Permissions Table (NEW)
```sql
CREATE TABLE roles_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role VARCHAR(50),
  builder_id INT,  -- NULL for platform-level roles
  society_id INT,  -- NULL for builder-level roles
  permission_name VARCHAR(100),
  created_at TIMESTAMP,
  UNIQUE (role, builder_id, society_id, permission_name)
);
```

#### 6. Audit Logs Table (NEW)
```sql
CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  builder_id INT,
  society_id INT,
  user_id INT,
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY (builder_id, society_id, user_id, created_at)
);
```

## API Endpoints Structure

### Platform APIs (Super Admin)
- `GET/POST /api/super-admin/builders` - Manage builders
- `GET/POST /api/super-admin/subscriptions` - Manage subscriptions
- `GET /api/super-admin/analytics` - Platform analytics

### Builder APIs (Builder Admin)
- `GET /api/builder/societies` - List societies
- `POST /api/builder/societies` - Create society
- `GET /api/builder/settings` - Builder settings
- `GET /api/builder/analytics` - Builder dashboard

### Society APIs (Society Admin)
- `GET/POST /api/society/towers` - Manage towers
- `GET/POST /api/society/wings` - Manage wings
- `GET/POST /api/society/flats` - Manage flats
- `GET/POST /api/society/residents` - Manage residents
- `GET /api/society/dashboard` - Society dashboard

### Public APIs
- `GET /api/public/wings?societyCode=XXX` - Dynamic wings for registration

## Data Isolation Strategy

### Request Middleware
1. Extract `builder_id` from token or request
2. Extract `society_id` from URL or request
3. Apply filters to all queries: `WHERE builder_id = ? AND society_id = ?`

### Model Layer
- All find/list operations include builder/society filters
- No query bypasses isolation checks

### Example Query
```sql
SELECT * FROM flats 
WHERE society_id = ? 
AND builder_id = ?
AND wing_id = ?
```

## Role-Based Dashboards

### Super Admin Dashboard
- All builders, societies, users, analytics
- System health, subscriptions
- Revenue reporting

### Builder Dashboard
- Societies overview, total residents
- Revenue per society
- Occupancy analytics
- User management
- Subscription management

### Society Admin Dashboard
- Real-time overview (residents, complaints, visitors)
- Wing/tower/flat management
- Staff management
- Reports and analytics
- AI insights

### Owner Dashboard
- Property details, tenant info
- Bills and payments
- Complaints
- Visitor pre-approvals
- Chat

### Tenant Dashboard
- Property info, owner contact
- Bills and payments
- Maintenance requests
- Community features

### Guard Dashboard
- Visitor check-in/out
- Incident reporting
- Daily logs

## Registration Flow

### Step 1: Builder Registration
- Sign up as builder with company info
- Set up subscription plan
- Email verification

### Step 2: Create Society
- Society name, code, location
- Configure structure (towers, wings, floors)
- Upload flat master

### Step 3: Society Admin Registration
- Admin email, password
- Assign as society admin

### Step 4: Resident Registration (Public)
- Select society code (autocomplete)
- Select tower/wing (fetched from API)
- Select floor/flat (fetched from API)
- Resident type: Owner or Tenant
- Email verification
- Society admin approval

## Security Implementation

### JWT Payload Structure
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "society_admin",
  "builder_id": 10,
  "society_id": 5,
  "permissions": ["manage_residents", "view_analytics"],
  "iat": 1234567890
}
```

### Request Flow
```
Client Request
  ↓
AuthMiddleware (verify JWT)
  ↓
TenantMiddleware (extract builder_id, society_id)
  ↓
PermissionMiddleware (check RBAC)
  ↓
Controller (fetch data with builder/society filters)
  ↓
AuditMiddleware (log action)
  ↓
Response
```

## Next Steps
1. Create database migrations
2. Update models with builder_id support
3. Create builder management APIs
4. Update registration flow
5. Create role-based dashboards
6. Implement permission system
7. Add audit logging
8. Add real-time features
