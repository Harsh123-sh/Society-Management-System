import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, StatusBadge } from '@/components/ui/premium';
import { Sidebar, SidebarItem } from '@/components/layout/premium/Sidebar';
import { Topbar } from '@/components/layout/premium/Topbar';
import clsx from 'clsx';

/**
 * PREMIUM DASHBOARD TEMPLATE
 * Apple + Linear Inspired Modern Dashboard
 * 
 * This serves as a base template for all role-based dashboards:
 * - Super Admin
 * - Admin/Chairman
 * - Secretary
 * - Resident
 * - Security
 */

interface DashboardProps {
  role: 'superadmin' | 'admin' | 'secretary' | 'resident' | 'security';
  userName?: string;
  userRole?: string;
}

const PremiumDashboardTemplate: React.FC<DashboardProps> = ({
  role,
  userName = 'John Doe',
  userRole = 'Administrator',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sidebar items based on role
  const getSidebarItems = (): SidebarItem[] => {
    const commonItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: '📊',
      },
      {
        id: 'messages',
        label: 'Messages',
        href: '/messages',
        icon: '💬',
        badge: 3,
      },
      { divider: true },
    ];

    const roleItems = {
      superadmin: [
        {
          id: 'societies',
          label: 'Societies',
          href: '/admin/societies',
          icon: '🏢',
        },
        {
          id: 'analytics',
          label: 'Analytics',
          href: '/admin/analytics',
          icon: '📈',
        },
        {
          id: 'revenue',
          label: 'Revenue',
          href: '/admin/revenue',
          icon: '💰',
        },
      ],
      admin: [
        {
          id: 'residents',
          label: 'Residents',
          href: '/admin/residents',
          icon: '👥',
        },
        {
          id: 'collections',
          label: 'Collections',
          href: '/admin/collections',
          icon: '💳',
        },
        {
          id: 'approvals',
          label: 'Approvals',
          href: '/admin/approvals',
          icon: '✓',
          badge: 5,
        },
        {
          id: 'complaints',
          label: 'Complaints',
          href: '/admin/complaints',
          icon: '⚠',
          badge: 2,
        },
      ],
      secretary: [
        {
          id: 'maintenance',
          label: 'Maintenance',
          href: '/secretary/maintenance',
          icon: '🔧',
        },
        {
          id: 'staff',
          label: 'Staff',
          href: '/secretary/staff',
          icon: '👔',
        },
        {
          id: 'schedule',
          label: 'Schedule',
          href: '/secretary/schedule',
          icon: '📅',
        },
      ],
      resident: [
        {
          id: 'notices',
          label: 'Notices',
          href: '/resident/notices',
          icon: '📢',
        },
        {
          id: 'maintenance',
          label: 'Maintenance',
          href: '/resident/maintenance',
          icon: '🔧',
          badge: 1,
        },
        {
          id: 'visitors',
          label: 'Visitors',
          href: '/resident/visitors',
          icon: '🚪',
        },
        {
          id: 'documents',
          label: 'Documents',
          href: '/resident/documents',
          icon: '📄',
        },
      ],
      security: [
        {
          id: 'visitors',
          label: 'Visitors',
          href: '/security/visitors',
          icon: '👤',
        },
        {
          id: 'gatepasses',
          label: 'Gate Passes',
          href: '/security/gatepasses',
          icon: '🎟',
        },
        {
          id: 'checkin',
          label: 'Check-in/Out',
          href: '/security/checkin',
          icon: '🚗',
        },
      ],
    };

    return [
      ...commonItems,
      ...roleItems[role],
      { divider: true },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: '⚙',
      },
    ];
  };

  // Metric Cards
  const MetricCard = ({
    icon,
    label,
    value,
    change,
    trend,
  }: {
    icon: string;
    label: string;
    value: string | number;
    change: string;
    trend: 'up' | 'down' | 'neutral';
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="glass" className="hover:shadow-lg transition-all duration-300">
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="text-3xl">{icon}</div>
            {trend === 'up' && (
              <Badge variant="success" size="sm">
                ↑ {change}
              </Badge>
            )}
            {trend === 'down' && (
              <Badge variant="danger" size="sm">
                ↓ {change}
              </Badge>
            )}
            {trend === 'neutral' && (
              <Badge variant="secondary" size="sm">
                {change}
              </Badge>
            )}
          </div>

          <div>
            <p className="text-sm text-text-secondary mb-1">{label}</p>
            <p className="text-3xl font-bold text-text">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Recent Activity
  const ActivityItem = ({
    icon,
    title,
    description,
    time,
    status,
  }: {
    icon: string;
    title: string;
    description: string;
    time: string;
    status: 'success' | 'pending' | 'warning';
  }) => (
    <motion.div
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-hover-bg transition-colors duration-200"
      whileHover={{ x: 4 }}
    >
      <span className="text-2xl flex-shrink-0">{icon}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="font-medium text-text truncate">{title}</p>
          <p className="text-xs text-text-tertiary flex-shrink-0">{time}</p>
        </div>

        <p className="text-sm text-text-secondary mb-2 truncate">{description}</p>

        <div className="flex items-center gap-2">
          <StatusBadge status={status === 'success' ? 'completed' : status === 'pending' ? 'pending' : 'approved'} size="sm" />
        </div>
      </div>
    </motion.div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        items={getSidebarItems()}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        logoText="Society"
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        footer={
          <div className="text-xs text-text-secondary text-center py-2">
            <p>NEXORA</p>
            <p>© 2024 - v1.0</p>
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          leftContent={
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-hover-bg rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          }
          searchBar={{
            placeholder: 'Search...',
          }}
          actions={[
            {
              id: 'notifications',
              icon: '🔔',
              badge: '3',
              menu: [
                { label: 'New message from Chairman', onClick: () => {} },
                { label: 'Maintenance scheduled tomorrow', onClick: () => {} },
                { divider: true },
                { label: 'Mark all as read', onClick: () => {} },
              ],
            },
          ]}
          profile={{
            name: userName,
            role: userRole,
            onLogout: () => console.log('Logged out'),
          }}
        />

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            className="p-6 space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={itemVariants}>
              <h1 className="text-3xl font-bold text-text mb-2">Welcome, {userName}!</h1>
              <p className="text-text-secondary">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </motion.div>

            {/* Metrics Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <MetricCard
                icon="👥"
                label="Total Residents"
                value="1,248"
                change="12%"
                trend="up"
              />

              <MetricCard
                icon="💰"
                label="Monthly Collections"
                value="₹4,56,000"
                change="8%"
                trend="up"
              />

              <MetricCard
                icon="⚠️"
                label="Pending Approvals"
                value="23"
                change="5%"
                trend="down"
              />

              <MetricCard
                icon="✓"
                label="Resolved Issues"
                value="156"
                change="18%"
                trend="up"
              />
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left - Large Card */}
              <motion.div
                className="lg:col-span-2"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle>Monthly Overview</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Chart Placeholder */}
                      <div className="h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                        <p className="text-text-secondary">📊 Chart Area</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                        <div className="text-center">
                          <p className="text-sm text-text-secondary">This Month</p>
                          <p className="text-2xl font-bold text-text mt-1">₹4,56,000</p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-text-secondary">Last Month</p>
                          <p className="text-2xl font-bold text-text mt-1">₹4,20,000</p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-text-secondary">Growth</p>
                          <p className="text-2xl font-bold text-success mt-1">+8.6%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right - Activity Feed */}
              <motion.div
                className="lg:col-span-1"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Recent Activity</span>
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <ActivityItem
                      icon="💬"
                      title="New Message"
                      description="From Chairman"
                      time="2h ago"
                      status="pending"
                    />

                    <ActivityItem
                      icon="👤"
                      title="New Resident"
                      description="Flat B-504"
                      time="5h ago"
                      status="success"
                    />

                    <ActivityItem
                      icon="⚠️"
                      title="Complaint Filed"
                      description="Water leakage"
                      time="1d ago"
                      status="pending"
                    />

                    <ActivityItem
                      icon="✓"
                      title="Issue Resolved"
                      description="Gate repair completed"
                      time="2d ago"
                      status="success"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Card variant="gradient">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: '✍️', label: 'New Notice' },
                      { icon: '💳', label: 'Collect Dues' },
                      { icon: '👥', label: 'Add Resident' },
                      { icon: '📊', label: 'View Reports' },
                    ].map((action, i) => (
                      <Button
                        key={i}
                        variant="secondary"
                        className="flex flex-col items-center justify-center h-auto py-3 gap-2"
                      >
                        <span className="text-2xl">{action.icon}</span>
                        <span className="text-xs text-center">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PremiumDashboardTemplate;
