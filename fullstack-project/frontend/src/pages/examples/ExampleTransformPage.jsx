import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Select,
  Badge,
  StatusBadge,
  Modal,
  useModal,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableDataCell,
  TableEmpty,
  Skeleton,
  EmptyState,
  EmptySearchResults,
  Pagination,
  PageInfo,
  Tooltip,
  useToast,
} from '../ui/premium';
import { Sidebar } from '../layout/premium/Sidebar';
import { Topbar } from '../layout/premium/Topbar';

/**
 * Example: Complete Page Transformation
 * Shows how to use all premium components together in a real page
 * 
 * This example demonstrates:
 * - Sidebar & Topbar navigation
 * - Form inputs with validation
 * - Data tables with sorting
 * - Modal dialogs
 * - Pagination
 * - Toast notifications
 * - Empty states
 * - Loading skeletons
 */

export default function ExampleTransformPage() {
  const { success, error } = useToast();
  const { isOpen, open, close } = useModal();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'active',
    role: 'resident',
  });

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Sample data
  const allData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', role: 'resident' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', role: 'secretary' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'pending', role: 'security' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', status: 'active', role: 'admin' },
    { id: 5, name: 'Tom Brown', email: 'tom@example.com', status: 'active', role: 'resident' },
  ];

  const filteredData = allData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pageSize = 3;
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handlers
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (formData.name && formData.email) {
      success('User added successfully!', {
        title: 'Success',
        duration: 3000,
      });
      setFormData({ name: '', email: '', status: 'active', role: 'resident' });
      close();
    } else {
      error('Please fill in all fields');
    }

    setIsLoading(false);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sidebar items
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { id: 'users', label: 'Users', href: '/users', icon: '👥' },
    { id: 'settings', label: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        items={sidebarItems}
        logo="SMS"
        logoText="Society Management"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          searchBar={{
            placeholder: 'Search users...',
            onSearch: setSearchQuery,
            value: searchQuery,
          }}
          profile={{
            name: 'Admin User',
            role: 'Administrator',
            onLogout: () => success('Logged out successfully'),
          }}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-text mb-2">
                  User Management
                </h1>
                <p className="text-text-secondary">
                  Manage and view all users in your society
                </p>
              </div>
              <Tooltip content="Add a new user" position="bottom">
                <Button
                  variant="primary"
                  onClick={open}
                  className="gap-2"
                >
                  ➕ Add User
                </Button>
              </Tooltip>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card variant="glass">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">Total Users</p>
                      <p className="text-3xl font-bold text-text mt-2">
                        {allData.length}
                      </p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                </Card.Content>
              </Card>

              <Card variant="glass">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">Active</p>
                      <p className="text-3xl font-bold text-success mt-2">
                        {allData.filter(u => u.status === 'active').length}
                      </p>
                    </div>
                    <div className="text-4xl">✓</div>
                  </div>
                </Card.Content>
              </Card>

              <Card variant="glass">
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm">Pending</p>
                      <p className="text-3xl font-bold text-warning mt-2">
                        {allData.filter(u => u.status === 'pending').length}
                      </p>
                    </div>
                    <div className="text-4xl">⏳</div>
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* Data Table */}
            <Card variant="solid">
              <Card.Header className="border-b border-surface-secondary">
                <Card.Title>Users List</Card.Title>
                <Card.Description>
                  {paginatedData.length > 0
                    ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredData.length)} of ${filteredData.length} users`
                    : 'No users found'}
                </Card.Description>
              </Card.Header>

              <Card.Content className="p-0">
                {isLoading ? (
                  <div className="p-6">
                    <Skeleton variant="text" count={3} />
                  </div>
                ) : paginatedData.length > 0 ? (
                  <Table variant="striped">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell
                          sortable
                          sorted={sortColumn === 'name' ? sortDirection : false}
                          onSort={() => handleSort('name')}
                        >
                          Name
                        </TableHeaderCell>
                        <TableHeaderCell
                          sortable
                          sorted={sortColumn === 'email' ? sortDirection : false}
                          onSort={() => handleSort('email')}
                        >
                          Email
                        </TableHeaderCell>
                        <TableHeaderCell
                          sortable
                          sorted={sortColumn === 'role' ? sortDirection : false}
                          onSort={() => handleSort('role')}
                        >
                          Role
                        </TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell align="center">Actions</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.map((user) => (
                        <TableRow key={user.id} hoverable>
                          <TableDataCell variant="default">
                            {user.name}
                          </TableDataCell>
                          <TableDataCell variant="muted">
                            {user.email}
                          </TableDataCell>
                          <TableDataCell variant="default">
                            <Badge variant="outline">{user.role}</Badge>
                          </TableDataCell>
                          <TableDataCell>
                            <StatusBadge status={user.status} />
                          </TableDataCell>
                          <TableDataCell align="center">
                            <div className="flex gap-2 justify-center">
                              <Tooltip content="Edit user">
                                <Button variant="ghost" size="sm">
                                  ✏️
                                </Button>
                              </Tooltip>
                              <Tooltip content="Delete user">
                                <Button variant="ghost" size="sm">
                                  🗑️
                                </Button>
                              </Tooltip>
                            </div>
                          </TableDataCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8">
                    <EmptySearchResults
                      size="md"
                      action={{
                        label: 'Clear Search',
                        onClick: () => setSearchQuery(''),
                      }}
                    />
                  </div>
                )}
              </Card.Content>

              {paginatedData.length > 0 && (
                <Card.Footer className="border-t border-surface-secondary flex justify-between items-center">
                  <PageInfo
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={filteredData.length}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    maxVisible={5}
                  />
                </Card.Footer>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Modal - Add User */}
      <Modal isOpen={isOpen} onClose={close} size="md">
        <Modal.Header>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>

        <Modal.Content>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              icon="👤"
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              icon="📧"
            />

            <Select
              label="Role"
              options={[
                { value: 'resident', label: 'Resident' },
                { value: 'secretary', label: 'Secretary' },
                { value: 'admin', label: 'Admin' },
                { value: 'security', label: 'Security' },
              ]}
              value={formData.role}
              onChange={(value) =>
                setFormData({ ...formData, role: value })
              }
            />

            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' },
              ]}
              value={formData.status}
              onChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            />
          </form>
        </Modal.Content>

        <Modal.Footer>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleFormSubmit}
            isLoading={isLoading}
          >
            Add User
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
