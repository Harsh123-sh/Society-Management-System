# Premium Component Library - Quick Reference Card

## 🚀 Quick Start

### 1. Setup Toast System
```jsx
// In your App.jsx or main entry point
import { ToastProvider } from './components/ui/premium';

<ToastProvider>
  {/* Your app here */}
</ToastProvider>
```

### 2. Import Components
```jsx
import {
  Button, Card, Input, Select, Badge, Modal, useModal,
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableDataCell,
  Skeleton, EmptyState, Tooltip, Pagination, useToast
} from '@/components/ui/premium';

import { Sidebar, Topbar } from '@/components/layout/premium';
```

### 3. Use in Your Component
```jsx
export default function MyPage() {
  const { success, error } = useToast();
  const { isOpen, open, close } = useModal();
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar items={items} />
      <div className="flex-1 flex flex-col">
        <Topbar searchBar={{...}} />
        <div className="flex-1 overflow-y-auto p-6">
          {/* Your content */}
        </div>
      </div>
    </div>
  );
}
```

---

## 📋 Component Quick Reference

### Button
```jsx
<Button 
  variant="primary"        // primary, secondary, tertiary, danger, success, outline, glass, ghost
  size="md"                // xs, sm, md, lg, xl, 2xl, icon
  isLoading={false}
  disabled={false}
  fullWidth={false}
  icon="📝"
  onClick={handleClick}
>
  Click Me
</Button>
```

### Card
```jsx
<Card variant="glass">     // solid, glass, elevated, flat, gradient, interactive
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>
    Content here
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

### Input
```jsx
<Input
  label="Field Label"
  type="text"              // text, email, password, number, tel, url, date
  variant="default"        // default, glass, filled
  size="md"                // sm, md, lg
  placeholder="Enter..."
  error={errorMsg}         // Shows red with error styling
  success={true}           // Shows green with checkmark
  icon="📧"
  rightIcon="✓"
  maxLength={50}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Select
```jsx
<Select
  label="Choose"
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2', disabled: true }
  ]}
  value={selected}
  onChange={setValue}
  variant="default"        // default, glass, filled
  size="md"                // sm, md, lg
  searchable={true}
  clearable={true}
  placeholder="Select..."
/>
```

### Badge / StatusBadge
```jsx
// Regular Badge
<Badge variant="primary">Tag</Badge>    // primary, success, warning, danger, info, secondary, outline, gradient

// Status Badge (preset)
<StatusBadge status="active" />         // active, inactive, pending, completed, failed, approved, rejected
```

### Modal
```jsx
const { isOpen, open, close } = useModal();

<Modal isOpen={isOpen} onClose={close} size="md">  // sm, md, lg, xl
  <Modal.Header>
    <Modal.Title>Dialog Title</Modal.Title>
  </Modal.Header>
  <Modal.Content>
    Content here
  </Modal.Content>
  <Modal.Footer>
    <Button variant="secondary" onClick={close}>Cancel</Button>
    <Button onClick={save}>Save</Button>
  </Modal.Footer>
</Modal>
```

### Table
```jsx
<Table variant="striped">
  <TableHead>
    <TableRow>
      <TableHeaderCell
        sortable={true}
        sorted={'asc'}         // 'asc', 'desc', false
        onSort={() => handleSort()}
      >
        Column 1
      </TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id} hoverable={true}>
        <TableDataCell variant="default">  // default, muted, success, danger, warning
          {item.name}
        </TableDataCell>
      </TableRow>
    ))}
  </TableBody>
  <TableEmpty>
    <p>No data found</p>
  </TableEmpty>
</Table>
```

### Skeleton
```jsx
<Skeleton variant="text" count={3} />
<Skeleton variant="rectangular" height={120} width="100%" />
<SkeletonCard />
<SkeletonTable rows={5} columns={4} />
```

### EmptyState
```jsx
<EmptyState
  icon="📭"
  title="No data"
  description="Nothing to show here"
  size="md"                  // sm, md, lg
  action={{
    label: "Create New",
    onClick: handleCreate
  }}
  secondaryAction={{
    label: "Cancel",
    onClick: handleCancel
  }}
/>

// Or use presets
<EmptySearchResults size="md" />
<EmptyNoData size="md" />
<EmptyNoPermission size="md" />
<EmptyServerError size="md" />
<EmptyNoNotifications size="md" />
<EmptyNoMessages size="md" />
<EmptyNoMembers size="md" />
<EmptyOffline size="md" />
```

### Toast/Notifications
```jsx
const { success, error, warning, info } = useToast();

success('Operation successful!', {
  title: 'Success',
  duration: 3000,
  action: { label: 'Undo', onClick: () => {} }
});

error('Something went wrong!');
warning('Are you sure?');
info('FYI: Something happened');
```

### Tooltip
```jsx
<Tooltip
  content="Help text"
  position="top"             // top, right, bottom, left
  variant="default"          // default, dark, light
  delay={200}
  maxWidth="200px"
  arrow={true}
>
  <Button>Hover me</Button>
</Tooltip>
```

### Pagination
```jsx
const [page, setPage] = useState(1);

<div className="flex justify-between items-center">
  <PageInfo 
    currentPage={page} 
    pageSize={10} 
    totalItems={100} 
  />
  
  <Pagination
    currentPage={page}
    totalPages={10}
    onPageChange={setPage}
    maxVisible={5}
    showFirstLast={true}
    showPreviousNext={true}
    size="md"              // sm, md, lg
  />
</div>
```

### Sidebar
```jsx
<Sidebar
  items={[
    { id: 'home', label: 'Home', href: '/home', icon: '🏠' },
    { 
      id: 'menu', 
      label: 'Menu', 
      children: [
        { id: 'sub1', label: 'Sub Item 1', href: '/sub1' }
      ]
    },
    { id: 'settings', label: 'Settings', href: '/settings', badge: '2' }
  ]}
  logo="SMS"
  logoText="Society Management"
  collapsed={false}
  onCollapsedChange={setCollapsed}
  footer={<p>© 2024</p>}
/>
```

### Topbar
```jsx
<Topbar
  searchBar={{
    placeholder: 'Search...',
    value: query,
    onSearch: setQuery
  }}
  actions={[
    {
      id: 'notify',
      icon: '🔔',
      label: 'Notifications',
      badge: '5',
      menu: [
        { label: 'Notify 1', onClick: () => {} }
      ]
    }
  ]}
  profile={{
    name: 'John Doe',
    role: 'Admin',
    avatar: 'URL',
    onLogout: handleLogout
  }}
/>
```

---

## 🎨 Theme & Colors

### Using CSS Variables
```css
/* Colors */
var(--color-primary)
var(--color-success)
var(--color-warning)
var(--color-danger)
var(--color-info)

/* Surfaces */
var(--color-surface)
var(--color-surface-secondary)

/* Text */
var(--color-text)
var(--color-text-secondary)
var(--color-text-tertiary)

/* Shadows */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
```

### Dark Mode
```jsx
// Toggle dark mode
document.documentElement.classList.toggle('dark');

// All CSS variables automatically switch
// No additional code needed!
```

---

## 🔧 Common Patterns

### Form with Validation
```jsx
const [formData, setFormData] = useState({ name: '', email: '' });
const [errors, setErrors] = useState({});

const handleSubmit = (e) => {
  e.preventDefault();
  const newErrors = {};
  
  if (!formData.name) newErrors.name = 'Name required';
  if (!formData.email) newErrors.email = 'Email required';
  
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  
  success('Form submitted!');
  // Submit...
};

return (
  <form onSubmit={handleSubmit} className="space-y-4">
    <Input
      label="Name"
      value={formData.name}
      onChange={(e) => setFormData({...formData, name: e.target.value})}
      error={errors.name}
    />
    <Input
      label="Email"
      type="email"
      value={formData.email}
      onChange={(e) => setFormData({...formData, email: e.target.value})}
      error={errors.email}
    />
    <Button variant="primary" fullWidth>Submit</Button>
  </form>
);
```

### Table with Sorting & Pagination
```jsx
const [page, setPage] = useState(1);
const [sort, setSort] = useState({ column: 'name', dir: 'asc' });

const handleSort = (column) => {
  if (sort.column === column) {
    setSort({ column, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
  } else {
    setSort({ column, dir: 'asc' });
  }
};

const pageSize = 10;
const filteredData = data.sort((a, b) => {
  // Implement sorting
});
const paginatedData = filteredData.slice((page-1)*pageSize, page*pageSize);

return (
  <Card>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell 
            sortable 
            sorted={sort.column === 'name' ? sort.dir : false}
            onSort={() => handleSort('name')}
          >
            Name
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {paginatedData.map(item => (
          <TableRow key={item.id} hoverable>
            <TableDataCell>{item.name}</TableDataCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <Card.Footer className="flex justify-between">
      <PageInfo currentPage={page} pageSize={pageSize} totalItems={data.length} />
      <Pagination 
        currentPage={page} 
        totalPages={Math.ceil(data.length / pageSize)}
        onPageChange={setPage}
      />
    </Card.Footer>
  </Card>
);
```

---

## 📁 File Locations

```
/src/components/ui/premium/          # All 14 UI components
/src/components/layout/premium/      # Sidebar & Topbar
/src/design/designTokens.js          # Design system tokens
/src/index.css                       # CSS variables
/tailwind.config.js                  # Tailwind config

PREMIUM_DESIGN_GUIDE.md              # Design system reference
MIGRATION_CHECKLIST.md               # Page transformation guide
ExampleTransformPage.jsx             # Complete integration example
ComponentShowcase.jsx                # Interactive component demo
```

---

## 🎯 Common Tasks

### Dark Mode Support
```jsx
// Automatic! Use CSS variables and it just works
// Colors in index.css switch between light/dark mode
```

### Responsive Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  {/* ... */}
</div>
```

### Loading State
```jsx
const [isLoading, setIsLoading] = useState(false);

<Button isLoading={isLoading}>Submit</Button>

// Or use Skeleton
{isLoading ? <SkeletonCard /> : <Card>Content</Card>}
```

### Error Handling
```jsx
{error && (
  <Card variant="glass" className="border border-danger/30 bg-danger/5">
    <Card.Content>
      <p className="text-danger">{error}</p>
    </Card.Content>
  </Card>
)}
```

---

## ❓ FAQ

**Q: How do I customize colors?**
A: Edit `/src/design/designTokens.js` and `/src/index.css`

**Q: How do I add dark mode?**
A: Add `<ToastProvider>` and toggle with `document.documentElement.classList.toggle('dark')`

**Q: How do I change animations?**
A: Modify `DESIGN_TOKENS.animation` in `designTokens.js`

**Q: How do I use with existing styles?**
A: Mix Tailwind classes with premium components

**Q: TypeScript support?**
A: Yes! All components have TypeScript interfaces

---

## 📞 Need Help?

1. Check `PREMIUM_DESIGN_GUIDE.md` for examples
2. Look at `ComponentShowcase.jsx` for live demos
3. Review `ExampleTransformPage.jsx` for integration patterns
4. Read component JSDoc comments for APIs

---

**Last Updated**: Current Session
**Version**: 1.0.0
**Status**: Production-Ready ✅
