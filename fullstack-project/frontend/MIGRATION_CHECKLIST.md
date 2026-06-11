# Premium UI Migration Checklist

## Overview

This checklist guides the transformation of each existing page to use the new premium component library. Use this as your template for each page you migrate.

---

## Template: Page Transformation Checklist

### Page Name: `[PageName].jsx`
- **Current Location**: `src/pages/...`
- **Status**: ⏳ In Progress / ✅ Complete / 🔲 Not Started
- **Estimated Time**: 2-4 hours
- **Difficulty**: Easy / Medium / Hard

### Pre-Migration Analysis
- [ ] List all components used in current page
- [ ] Identify forms and their fields
- [ ] Identify tables and their columns
- [ ] Identify modals/dialogs
- [ ] Document existing state management
- [ ] Note any custom styling

### Import Updates
- [ ] Add import for premium components
```jsx
import {
  Button,
  Card,
  Input,
  Select,
  Modal,
  useModal,
  Table,
  Badge,
  Pagination,
  useToast,
  // ... other needed components
} from '../../components/ui/premium';
```
- [ ] Add layout imports
```jsx
import { Sidebar } from '../../components/layout/premium/Sidebar';
import { Topbar } from '../../components/layout/premium/Topbar';
```

### Layout Transformation
- [ ] Replace old header with `<Topbar />`
  - [ ] Add search bar if needed
  - [ ] Add profile menu if needed
  - [ ] Add notifications if needed
- [ ] Replace old sidebar with `<Sidebar />`
  - [ ] Update sidebar items
  - [ ] Update active state logic
  - [ ] Update navigation
- [ ] Verify full page layout matches template

### Component Replacement

#### Buttons
- [ ] Find all `<button>` elements
- [ ] Replace with `<Button>` component
- [ ] Set appropriate `variant`: primary/secondary/danger/outline/glass
- [ ] Set appropriate `size`: sm/md/lg
- [ ] Add `icon` if needed
- [ ] Update loading states with `isLoading` prop

#### Forms
- [ ] Find all `<input>` elements
- [ ] Replace with `<Input>` component
- [ ] Add `label` prop
- [ ] Add `icon` if appropriate
- [ ] Add validation feedback
  - [ ] Add `error` prop for validation errors
  - [ ] Add `success` prop for success state
- [ ] Add `placeholder` text
- [ ] Update form `onSubmit` handler
- [ ] Add form-level error display
- [ ] Add success toast notifications

#### Select/Dropdown
- [ ] Find all `<select>` elements
- [ ] Replace with `<Select>` component
- [ ] Format options array: `[{value, label, icon?, disabled?}]`
- [ ] Add `label` prop
- [ ] Add `searchable` if many options
- [ ] Add `clearable` if appropriate

#### Cards/Panels
- [ ] Find all `.card`, `.panel`, `.box` styled containers
- [ ] Replace with `<Card>` component
- [ ] Choose appropriate `variant`: solid/glass/elevated
- [ ] Update structure:
```jsx
<Card variant="glass">
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>
    {/* Content */}
  </Card.Content>
  <Card.Footer>
    {/* Footer actions */}
  </Card.Footer>
</Card>
```

#### Tables
- [ ] Find all `<table>` elements
- [ ] Replace with `<Table>` component
- [ ] Structure:
```jsx
<Table variant="striped">
  <TableHead>
    <TableRow>
      <TableHeaderCell sortable onSort={handleSort}>
        Column
      </TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {data.map(row => (
      <TableRow key={row.id} hoverable>
        <TableDataCell>{row.name}</TableDataCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```
- [ ] Add `hoverable` prop to rows
- [ ] Add sorting with `sortable` headers
- [ ] Add row actions (edit/delete buttons)
- [ ] Add empty state with `<TableEmpty>`
- [ ] Add pagination below table

#### Status Badges
- [ ] Find all status indicators
- [ ] Replace with `<StatusBadge>` or `<Badge>`
- [ ] Use appropriate `status` values: active/inactive/pending/completed/failed/approved/rejected
- [ ] Update color scheme

#### Modals
- [ ] Find all modal/dialog elements
- [ ] Replace with `<Modal>` component
- [ ] Use `useModal()` hook:
```jsx
const { isOpen, open, close } = useModal();
```
- [ ] Structure:
```jsx
<Modal isOpen={isOpen} onClose={close} size="md">
  <Modal.Header>
    <Modal.Title>Title</Modal.Title>
  </Modal.Header>
  <Modal.Content>
    {/* Content */}
  </Modal.Content>
  <Modal.Footer>
    <Button onClick={close}>Cancel</Button>
    <Button variant="primary">Save</Button>
  </Modal.Footer>
</Modal>
```

#### Loading States
- [ ] Add `<Skeleton>` for content loading
- [ ] Use `isLoading` prop on buttons
- [ ] Add loading state to tables with skeleton rows
- [ ] Add loading spinner overlay if needed

#### Empty States
- [ ] Find empty page states
- [ ] Replace with appropriate `<EmptyState>` variant
- [ ] Options:
  - `<EmptySearchResults />`
  - `<EmptyNoData />`
  - `<EmptyNoPermission />`
  - `<EmptyServerError />`
  - `<EmptyNoNotifications />`

### Toast Notifications
- [ ] Add `useToast()` hook
- [ ] Replace `alert()` with `useToast().success()`
- [ ] Replace error displays with `useToast().error()`
- [ ] Add success toast on form submission
- [ ] Add error toast on API failures
- [ ] Add warning toast for confirmations

### Dark Mode Testing
- [ ] Test page in light mode
  - [ ] All text readable
  - [ ] All colors appropriate
  - [ ] All icons visible
  - [ ] All buttons clickable
- [ ] Test page in dark mode
  - [ ] All text readable
  - [ ] All colors appropriate
  - [ ] All icons visible
  - [ ] Contrast ratios meet WCAG AA

### Responsive Testing
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify:
  - [ ] Grid layouts adjust properly
  - [ ] Sidebar collapses/drawer on mobile
  - [ ] Table scrolls horizontally on small screens
  - [ ] Modals fit on small screens
  - [ ] Text remains readable
  - [ ] Touch targets are 44x44px minimum

### Functionality Testing
- [ ] Forms submit correctly
- [ ] Forms validate properly
- [ ] Modals open/close
- [ ] Tables sort correctly
- [ ] Pagination works
- [ ] Search/filter works
- [ ] Icons display correctly
- [ ] Animations play smoothly
- [ ] Hover states work
- [ ] Focus states are visible
- [ ] Keyboard navigation works

### Performance Testing
- [ ] Check page load time
- [ ] Check animations smoothness (60fps)
- [ ] Check bundle size increase
- [ ] Verify no console errors
- [ ] Verify no console warnings

### Accessibility Testing
- [ ] All form labels connected
- [ ] All buttons have text/aria-label
- [ ] All icons have descriptive text
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Color not sole indicator
- [ ] Sufficient contrast ratios

### Code Cleanup
- [ ] Remove old component imports
- [ ] Remove old CSS classes
- [ ] Remove dead code
- [ ] Add JSDoc comments
- [ ] Update component displayName
- [ ] Verify no TypeScript errors

### Final Review
- [ ] Code review completed
- [ ] Tests written (if applicable)
- [ ] Screenshot captured for before/after
- [ ] Git commit created with meaningful message
- [ ] No regressions introduced

---

## Pages to Transform

### Phase 3A: Authentication (Priority: HIGH)
- [ ] `src/pages/LoginPage.jsx`
  - Status: 🔲 Not Started
  - Component: PremiumLoginPage exists as reference
  
- [ ] `src/pages/RegisterPage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/ForgotPasswordPage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/OTPVerificationPage.jsx`
  - Status: 🔲 Not Started

### Phase 3B: Dashboards (Priority: HIGH)
- [ ] `src/pages/dashboard/SuperAdminDashboardPage.jsx`
  - Status: 🔲 Not Started
  - Component: PremiumDashboardTemplate exists as reference
  
- [ ] `src/pages/dashboard/AdminDashboardPage.jsx` / `AdminHomePage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/dashboard/SecretaryDashboardPage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/dashboard/ResidentDashboardPage.jsx` / `ResidentPage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/dashboard/SecurityDashboardPage.jsx`
  - Status: 🔲 Not Started

### Phase 3C: User Management (Priority: MEDIUM)
- [ ] `src/pages/ResidentsPage.jsx`
  - Status: 🔲 Not Started
  - Components: Table with forms
  
- [ ] `src/pages/StaffPage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/ProfilePage.jsx`
  - Status: 🔲 Not Started

### Phase 3D: Finances (Priority: MEDIUM)
- [ ] `src/pages/BillingPage.jsx`
  - Status: 🔲 Not Started
  - Components: Tables, forms
  
- [ ] `src/pages/CollectionsPage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/InvoicesPage.jsx`
  - Status: 🔲 Not Started

### Phase 3E: Communications (Priority: MEDIUM)
- [ ] `src/pages/ChatPage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/NoticesPage.jsx`
  - Status: 🔲 Not Started
  - Components: List, forms, modals
  
- [ ] `src/pages/ComplaintsPage.jsx`
  - Status: 🔲 Not Started

### Phase 3F: Operations (Priority: LOW)
- [ ] `src/pages/VisitorsPage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/MaintenancePage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/SchedulesPage.jsx`
  - Status: 🔲 Not Started

### Phase 3G: Admin (Priority: LOW)
- [ ] `src/pages/SettingsPage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/PermissionsPage.jsx`
  - Status: 🔲 Not Started
  
- [ ] `src/pages/AnalyticsPage.jsx`
  - Status: 🔲 Not Started

---

## Tips for Successful Migration

### 1. Start Simple
- Begin with pages that have simple layouts
- Move to complex dashboards later
- Test each page thoroughly before moving on

### 2. Use Template Patterns
- Reference `ExampleTransformPage.jsx` for patterns
- Copy component structure from `ComponentShowcase.jsx`
- Use `PREMIUM_DESIGN_GUIDE.md` for examples

### 3. Commit Frequently
- Make git commits after each page transformation
- Use descriptive commit messages
- Keep commits focused and atomic

### 4. Test Thoroughly
- Test light/dark modes
- Test responsive breakpoints
- Test all interactions
- Test edge cases (empty states, errors, loading)

### 5. Performance
- Use React.memo() for expensive components
- Lazy load components with React.lazy()
- Monitor bundle size increase
- Use browser DevTools to profile

### 6. Accessibility
- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers

---

## Common Pitfalls to Avoid

❌ **Don't**: Try to transform all pages at once
✅ **Do**: Transform one category at a time (auth, dashboards, etc.)

❌ **Don't**: Skip testing on mobile
✅ **Do**: Test on all breakpoints

❌ **Don't**: Ignore dark mode during development
✅ **Do**: Test both themes as you build

❌ **Don't**: Remove old components until migration complete
✅ **Do**: Keep old components until fully replaced

❌ **Don't**: Forget to update imports
✅ **Do**: Update all imports at once with search/replace

---

## Quick Command Reference

```bash
# Find all pages that need migration
find src/pages -name "*.jsx" -type f

# Find all button elements (to replace)
grep -r "<button" src/pages/

# Find all input elements (to replace)
grep -r "<input" src/pages/

# Find all tables (to replace)
grep -r "<table" src/pages/

# Find all modals/dialogs
grep -r "modal\|dialog\|Modal\|Dialog" src/pages/
```

---

## Progress Tracking

```
Total Pages to Transform: ~25
Estimated Total Time: 100-150 hours
Average per Page: 4-6 hours

Progress:
[                                        ] 0/25 (0%)

Phase 3A (Auth): 0/4
Phase 3B (Dashboards): 0/5
Phase 3C (Users): 0/3
Phase 3D (Finance): 0/3
Phase 3E (Communications): 0/3
Phase 3F (Operations): 0/3
Phase 3G (Admin): 0/3
```

---

**Last Updated**: Current Session
**Status**: Ready for Phase 3 Implementation
