/**
 * PREMIUM UI/UX DESIGN SYSTEM - IMPLEMENTATION GUIDE
 * 
 * This guide provides complete instructions for using the premium
 * component library and design system across the Society Management System.
 */

# Premium Design System - Complete Implementation Guide

## Overview

The Society Management System has been transformed with a premium Apple + Linear + Stripe inspired design system. All components follow modern SaaS best practices with glassmorphism, smooth animations, and comprehensive dark/light mode support.

## Design System Architecture

### Colors
- **Light Mode**: Clean backgrounds (#F5F7FA), White surfaces (#FFFFFF), Apple Blue primary (#007AFF)
- **Dark Mode**: Deep backgrounds (#0A0A0A), Dark surfaces (#111111), Bright blue primary (#0A84FF)
- All colors are CSS variables in `/src/index.css` for easy theming

### Spacing
- 8px grid system (4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 56px, 64px)
- Use `space-xs` through `space-3xl` Tailwind classes
- Consistent breathing room around components

### Typography
- **Font**: Inter (Apple-inspired, modern)
- **Sizes**: 12px to 40px with proper line heights
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Use `text-xs` through `text-7xl` for sizing

### Border Radius
- **xs**: 8px (small components)
- **sm**: 12px (buttons, small elements)
- **md**: 14px (inputs, standard elements)
- **lg**: 18px (cards)
- **xl**: 24px (large cards)
- **2xl**: 28px (modals)

## Component Usage Examples

### 1. Button Component

```jsx
import { Button } from '@/components/ui/premium';

// Primary Button
<Button variant="primary" size="md">
  Save Changes
</Button>

// With Loading State
<Button variant="primary" isLoading>
  Saving...
</Button>

// With Icon
<Button variant="secondary" icon={<IconComponent />}>
  Action
</Button>

// Danger Button
<Button variant="danger">
  Delete
</Button>

// Glass Button
<Button variant="glass">
  Glass Effect
</Button>

// Full Width
<Button fullWidth variant="primary">
  Submit
</Button>
```

### 2. Card Component

```jsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/premium';

// Simple Card
<Card variant="solid" padding="lg">
  Card Content
</Card>

// Glass Card
<Card variant="glass" padding="lg">
  Premium Glass Effect
</Card>

// Structured Card
<Card variant="solid">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Main content here
  </CardContent>
  <CardFooter>
    <Button variant="primary">Action</Button>
  </CardFooter>
</Card>

// Gradient Card
<Card variant="gradient">
  Gradient Background Card
</Card>
```

### 3. Input Component

```jsx
import { Input } from '@/components/ui/premium';

// Basic Input
<Input
  label="Email"
  placeholder="Enter your email"
  type="email"
/>

// With Icon
<Input
  label="Search"
  placeholder="Search..."
  icon={<SearchIcon />}
/>

// With Error
<Input
  label="Password"
  type="password"
  error="Password is required"
/>

// With Success
<Input
  label="Username"
  success
  value="john_doe"
/>

// Glass Variant
<Input
  variant="glass"
  label="Username"
  placeholder="Enter username"
/>

// Filled Variant
<Input
  variant="filled"
  label="Name"
  placeholder="Full name"
/>
```

### 4. Badge Component

```jsx
import { Badge, StatusBadge } from '@/components/ui/premium';

// Primary Badge
<Badge variant="primary">New</Badge>

// Status Badge
<StatusBadge status="active" />
<StatusBadge status="pending" />
<StatusBadge status="completed" />

// With Icon
<Badge variant="success" icon={<CheckIcon />}>
  Verified
</Badge>

// Outline Badge
<Badge variant="outline">
  Coming Soon
</Badge>

// Gradient Badge
<Badge variant="gradient">
  Premium
</Badge>

// Different Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
```

### 5. Modal Component

```jsx
import { Modal, useModal } from '@/components/ui/premium';
import { Button } from '@/components/ui/premium';

function MyComponent() {
  const { isOpen, open, close } = useModal();

  return (
    <>
      <Button onClick={open}>Open Modal</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Modal Title"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={close}>
              Confirm
            </Button>
          </>
        }
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

### 6. Table Component

```jsx
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableDataCell,
  TableEmpty,
} from '@/components/ui/premium';

<Table variant="striped">
  <TableHead>
    <TableRow>
      <TableHeaderCell sortable>Name</TableHeaderCell>
      <TableHeaderCell>Email</TableHeaderCell>
      <TableHeaderCell variant="danger">Status</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id} hoverable clickable>
        <TableDataCell>{item.name}</TableDataCell>
        <TableDataCell variant="muted">{item.email}</TableDataCell>
        <TableDataCell variant="success">Active</TableDataCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// Empty State
{items.length === 0 && (
  <TableEmpty
    message="No data available"
    icon="📭"
  />
)}
```

### 7. Sidebar Component

```jsx
import { Sidebar } from '@/components/layout/premium';

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    id: 'users',
    label: 'Users',
    href: '/users',
    icon: <UsersIcon />,
    badge: 5,
  },
  {
    divider: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: <SettingsIcon />,
    children: [
      {
        id: 'profile',
        label: 'Profile',
        href: '/settings/profile',
      },
      {
        id: 'security',
        label: 'Security',
        href: '/settings/security',
      },
    ],
  },
];

<Sidebar
  items={sidebarItems}
  logo={<LogoIcon />}
  logoText="Society"
  collapsed={collapsed}
  onCollapsedChange={setCollapsed}
/>
```

### 8. Topbar Component

```jsx
import { Topbar } from '@/components/layout/premium';

<Topbar
  leftContent={
    <h1 className="text-xl font-bold text-text">Dashboard</h1>
  }
  searchBar={{
    placeholder: 'Search...',
    onSearch: (query) => console.log(query),
  }}
  actions={[
    {
      id: 'notifications',
      icon: <BellIcon />,
      badge: '3',
      menu: [
        { label: 'New Message', onClick: () => {} },
        { label: 'Update Available', onClick: () => {} },
      ],
    },
  ]}
  profile={{
    name: 'John Doe',
    role: 'Administrator',
    avatar: '/path/to/avatar.jpg',
    onLogout: () => console.log('Logged out'),
  }}
/>
```

## Glassmorphism Effects

### CSS Classes
- `.glass` - Standard glass effect
- `.glass-lg` - Large glass effect (more visible)
- `.glass-sm` - Small glass effect (subtle)
- `.backdrop-blur-glass` - Overlay with blur

### Custom Glass Cards
```jsx
<div className="glass rounded-xl p-6">
  <h2 className="text-xl font-semibold text-text">
    Glass Card
  </h2>
</div>
```

## Animation System

All animations use Framer Motion with smooth 300ms-500ms durations:

- **Fade**: `animate-fade-in` / `animate-fade-out`
- **Slide**: `animate-slide-up` / `animate-slide-down`
- **Scale**: `animate-scale-in`
- **Bounce**: `animate-bounce-soft`
- **Glow**: `animate-glow-pulse`
- **Shimmer**: `animate-shimmer`

## Dark Mode Implementation

The system automatically switches between light and dark modes based on:
1. User's OS preference (default)
2. Manual theme toggle stored in localStorage
3. CSS class on html element: `<html class="dark">`

### Toggle Dark Mode
```jsx
<button
  onClick={() => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }}
>
  Toggle Theme
</button>
```

## Form Implementation Pattern

```jsx
import { useState } from 'react';
import { Input, Button, Card } from '@/components/ui/premium';

function MyForm() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate and submit
  };

  return (
    <Card className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
        />
        
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
        />

        <Button fullWidth variant="primary" type="submit">
          Submit
        </Button>
      </form>
    </Card>
  );
}
```

## Dashboard Pattern

```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/premium';

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Metric Card */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-text-secondary">
            Total Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-text">1,234</p>
          <p className="text-xs text-success mt-1">+12% from last month</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Performance Optimization

- Use `React.memo` for pure components
- Implement `useMemo` for expensive calculations
- Use `useCallback` for event handlers
- Lazy load heavy components with `React.lazy()`
- Enable code splitting with Vite

## Accessibility Checklist

- ✅ All inputs have associated labels
- ✅ Buttons have proper ARIA attributes
- ✅ Color contrast meets WCAG AA standards
- ✅ Focus rings are visible on all interactive elements
- ✅ Keyboard navigation supported throughout
- ✅ Screen reader support with semantic HTML

## Theme Variables

All theme variables are defined as CSS custom properties:

```css
/* Colors */
--background
--surface
--text
--primary
--success
--danger
--warning

/* Spacing */
--space-xs through --space-3xl

/* Radius */
--radius-xs through --radius-2xl

/* Shadows */
--shadow-xs through --shadow-elevated

/* Animation */
--duration-fast, --duration-normal, --duration-slow
--easing-out, --easing-inOut
```

Use variables in custom CSS:
```css
.custom-element {
  background: var(--surface);
  color: var(--text);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-md);
}
```

## Migration Checklist

When updating existing components:
- [ ] Replace old Button components with new Button
- [ ] Replace old Card/Panel components with new Card
- [ ] Update all input fields to use new Input component
- [ ] Convert tables to new Table component
- [ ] Update modal dialogs to use new Modal
- [ ] Replace old sidebar with new Sidebar
- [ ] Update topbar/navbar with new Topbar
- [ ] Ensure all pages support dark mode
- [ ] Test all animations and transitions
- [ ] Verify accessibility compliance

## Support & Troubleshooting

### Colors not updating?
- Clear browser cache and rebuild
- Check if dark mode class is properly set
- Verify CSS variables are defined in index.css

### Animations stuttering?
- Check for conflicting animations
- Reduce animation duration if needed
- Use will-change: transform for performance

### Components not styled?
- Ensure Tailwind CSS is properly imported
- Check if class-variance-authority is installed
- Verify postcss.config.js includes Tailwind

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready
