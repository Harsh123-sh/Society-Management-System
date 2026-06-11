import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Badge,
  StatusBadge,
  Modal,
  useModal,
} from '@/components/ui/premium';
import clsx from 'clsx';

/**
 * COMPONENT SHOWCASE PAGE
 * Demonstrates all premium components and design system features
 */

const ComponentShowcase = () => {
  const [selectedVariant, setSelectedVariant] = useState<string>('primary');
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { isOpen, open, close } = useModal();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Component Demo Section
  const SectionDemo = ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <motion.section
      className="mb-12"
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -100px 0px' }}
    >
      <Card variant="solid">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="text-text-secondary text-sm mt-2">{description}</p>
        </CardHeader>

        <CardContent className="bg-surface-secondary/30 rounded-lg p-6 space-y-6">
          {children}
        </CardContent>
      </Card>
    </motion.section>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-20 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">Premium Design System</h1>
          <Button
            variant="primary"
            onClick={() => {
              const isDark = document.documentElement.classList.toggle('dark');
              localStorage.setItem('theme', isDark ? 'dark' : 'light');
            }}
          >
            🌙 Toggle Theme
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        {/* Introduction */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-4xl font-bold text-text mb-4">
            Component Library Showcase
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            A comprehensive showcase of all premium components in the Society
            Management System design system. Built with React, Tailwind CSS, and
            Framer Motion.
          </p>
        </motion.div>

        <motion.div
          className="space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ============= BUTTONS ============= */}
          <SectionDemo
            title="Button Components"
            description="All button variants with different sizes, states, and behaviors"
          >
            <div className="space-y-6">
              {/* Primary Buttons */}
              <div>
                <h4 className="font-semibold text-text mb-3">Primary Buttons</h4>
                <div className="flex flex-wrap gap-3">
                  {['xs', 'sm', 'md', 'lg', 'xl'].map((size) => (
                    <Button
                      key={size}
                      variant="primary"
                      size={size as any}
                    >
                      {size.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* All Variants */}
              <div>
                <h4 className="font-semibold text-text mb-3">All Variants</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    'primary',
                    'secondary',
                    'tertiary',
                    'danger',
                    'success',
                    'outline',
                  ].map((variant) => (
                    <Button key={variant} variant={variant as any}>
                      {variant}
                    </Button>
                  ))}
                </div>
              </div>

              {/* States */}
              <div>
                <h4 className="font-semibold text-text mb-3">Button States</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Normal</Button>
                  <Button variant="primary" disabled>
                    Disabled
                  </Button>
                  <Button variant="primary" isLoading>
                    Loading
                  </Button>
                  <Button variant="primary" fullWidth className="max-w-xs">
                    Full Width
                  </Button>
                </div>
              </div>

              {/* With Icons */}
              <div>
                <h4 className="font-semibold text-text mb-3">With Icons</h4>
                <div className="flex flex-wrap gap-3">
                  <Button
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V18a1 1 0 102 0V5.414l6.293 6.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                    }
                  >
                    Download
                  </Button>
                  <Button
                    rightIcon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    }
                  >
                    Next
                  </Button>
                  <Button variant="ghost" size="icon">
                    ⚙️
                  </Button>
                </div>
              </div>
            </div>
          </SectionDemo>

          {/* ============= CARDS ============= */}
          <SectionDemo
            title="Card Components"
            description="Card variants with different styles and content layouts"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="solid">
                <CardHeader>
                  <CardTitle>Solid Card</CardTitle>
                </CardHeader>
                <CardContent>
                  Standard card with solid background and border
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Glass Card</CardTitle>
                </CardHeader>
                <CardContent>
                  Glassmorphism effect with backdrop blur
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                </CardHeader>
                <CardContent>
                  Strong shadow with hover lift effect
                </CardContent>
              </Card>

              <Card variant="gradient">
                <CardHeader>
                  <CardTitle>Gradient Card</CardTitle>
                </CardHeader>
                <CardContent>
                  Gradient background from primary to secondary
                </CardContent>
              </Card>
            </div>
          </SectionDemo>

          {/* ============= INPUTS ============= */}
          <SectionDemo
            title="Input Components"
            description="Text input variants with validation, icons, and states"
          >
            <div className="space-y-4 max-w-md">
              <Input
                label="Basic Input"
                placeholder="Enter text..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />

              <Input
                label="With Icon"
                placeholder="Search..."
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />

              <Input
                label="With Error"
                placeholder="Email"
                error="This field is required"
              />

              <Input
                label="Success State"
                placeholder="Username"
                success
                value="john_doe"
              />

              <Input
                label="Glass Variant"
                placeholder="Enter text..."
                variant="glass"
              />

              <Input
                label="Filled Variant"
                placeholder="Enter text..."
                variant="filled"
              />
            </div>
          </SectionDemo>

          {/* ============= BADGES ============= */}
          <SectionDemo
            title="Badge Components"
            description="Status badges and labels with different variants"
          >
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-text mb-3">Variants</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'primary',
                    'success',
                    'warning',
                    'danger',
                    'info',
                    'secondary',
                  ].map((variant) => (
                    <Badge key={variant} variant={variant as any}>
                      {variant}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text mb-3">Status Badges</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'active',
                    'inactive',
                    'pending',
                    'completed',
                    'approved',
                    'rejected',
                  ].map((status) => (
                    <StatusBadge
                      key={status}
                      status={status as any}
                      showDot
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text mb-3">With Icons</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">
                    ✓ Verified
                  </Badge>
                  <Badge variant="warning">
                    ⚠ Warning
                  </Badge>
                  <Badge variant="danger">
                    ✕ Error
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text mb-3">Sizes</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge size="sm">Small</Badge>
                  <Badge size="md">Medium</Badge>
                  <Badge size="lg">Large</Badge>
                </div>
              </div>
            </div>
          </SectionDemo>

          {/* ============= MODAL ============= */}
          <SectionDemo
            title="Modal Components"
            description="Glassmorphism modals with smooth animations"
          >
            <div className="space-y-4">
              <Button variant="primary" onClick={open}>
                Open Modal
              </Button>

              <Modal
                isOpen={isOpen}
                onClose={close}
                title="Modal Example"
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
                <div className="space-y-4">
                  <p>
                    This is a beautiful modal dialog built with Framer Motion
                    and glassmorphism effects. It includes animations, smooth
                    transitions, and full accessibility support.
                  </p>
                  <Input label="Name" placeholder="Enter your name" />
                  <Input label="Email" placeholder="Enter your email" />
                </div>
              </Modal>

              <p className="text-sm text-text-secondary">
                ℹ️ Click "Open Modal" button to see the modal in action
              </p>
            </div>
          </SectionDemo>

          {/* ============= COLORS ============= */}
          <SectionDemo
            title="Color System"
            description="Complete light and dark mode color palette"
          >
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-text mb-3">Semantic Colors</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { name: 'Primary', color: 'bg-primary' },
                    { name: 'Success', color: 'bg-success' },
                    { name: 'Warning', color: 'bg-warning' },
                    { name: 'Danger', color: 'bg-danger' },
                  ].map(({ name, color }) => (
                    <div key={name} className="space-y-2">
                      <div className={clsx(color, 'h-20 rounded-lg')} />
                      <p className="text-sm font-medium text-text">{name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text mb-3">
                  Surface Colors
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-surface rounded-lg border-2 border-border" />
                    <div>
                      <p className="font-medium text-text">Surface</p>
                      <p className="text-sm text-text-secondary">
                        Primary background color
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-surface-secondary rounded-lg border-2 border-border" />
                    <div>
                      <p className="font-medium text-text">Surface Secondary</p>
                      <p className="text-sm text-text-secondary">
                        Secondary background
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionDemo>

          {/* ============= ANIMATIONS ============= */}
          <SectionDemo
            title="Animation System"
            description="Smooth transitions and animations powered by Framer Motion"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'Fade', animation: 'animate-fade-in' },
                { name: 'Slide Up', animation: 'animate-slide-up' },
                { name: 'Bounce', animation: 'animate-bounce-soft' },
                { name: 'Glow', animation: 'animate-glow-pulse' },
              ].map(({ name, animation }) => (
                <div key={name} className="text-center">
                  <div className={clsx(animation, 'w-16 h-16 bg-primary rounded-xl mx-auto mb-2')} />
                  <p className="text-sm font-medium text-text">{name}</p>
                </div>
              ))}
            </div>
          </SectionDemo>

          {/* ============= RESPONSIVE GRID ============= */}
          <SectionDemo
            title="Responsive Grid"
            description="Adaptive layouts for all screen sizes"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center border border-border"
                >
                  <p className="text-text-secondary font-medium">Item {i + 1}</p>
                </div>
              ))}
            </div>
          </SectionDemo>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-20 text-center py-12 border-t border-border"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-text-secondary mb-4">
            Premium Design System v1.0.0
          </p>
          <p className="text-sm text-text-tertiary">
            Built with React, Tailwind CSS, Framer Motion, and ❤️
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ComponentShowcase;
