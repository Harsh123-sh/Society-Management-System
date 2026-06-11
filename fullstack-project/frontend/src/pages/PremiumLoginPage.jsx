import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input, Button } from '@/components/ui/premium';
import clsx from 'clsx';

/**
 * PREMIUM LOGIN PAGE
 * Apple + Linear + Stripe Inspired
 * 
 * Features:
 * - Split screen design (hero + form)
 * - Glassmorphism login card
 * - Animated background
 * - Smooth transitions
 * - Fully responsive
 */

const PremiumLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (email && password) {
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedEmail', email);
        }
        navigate('/dashboard');
      } else {
        setError('Please fill in all fields');
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Floating elements animation variants
  const floatingVariants = {
    animate: (i: number) => ({
      y: [0, -20, 0],
      transition: {
        duration: 4 + i * 0.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    }),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orb 1 */}
        <motion.div
          className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-gradient-to-r from-primary/20 to-secondary/10 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Gradient Orb 2 */}
        <motion.div
          className="absolute -bottom-32 right-0 w-96 h-96 rounded-full bg-gradient-to-l from-primary/20 to-success/10 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-stretch">
        {/* Left Section - Hero */}
        <motion.div
          className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-primary/5 to-secondary/5"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Header */}
          <div>
            <motion.div
              className="flex items-center gap-3 mb-16"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-lg font-bold">
                S
              </div>
              <h1 className="text-2xl font-bold text-text">Society Management</h1>
            </motion.div>

            <motion.div
              className="space-y-4 max-w-md"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.h2
                className="text-5xl font-bold text-text leading-tight"
                variants={itemVariants}
              >
                Modern Society Management
              </motion.h2>

              <motion.p
                className="text-lg text-text-secondary"
                variants={itemVariants}
              >
                Streamline operations, enhance communication, and manage your society with ease.
              </motion.p>
            </motion.div>
          </div>

          {/* Features */}
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { icon: '⚡', text: 'Lightning Fast Performance' },
              { icon: '🔒', text: 'Bank-Level Security' },
              { icon: '📱', text: 'Mobile Optimized' },
              { icon: '🌙', text: 'Dark Mode Support' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                variants={itemVariants}
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-text-secondary">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.p
            className="text-sm text-text-secondary"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            Join 1000+ communities already managing with us.
          </motion.p>
        </motion.div>

        {/* Right Section - Login Form */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Form Card */}
          <motion.div
            className="w-full max-w-md"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Welcome Text */}
            <motion.div className="mb-8 text-center" variants={itemVariants}>
              <h3 className="text-3xl font-bold text-text mb-2">Welcome Back</h3>
              <p className="text-text-secondary">
                Sign in to your account to continue
              </p>
            </motion.div>

            {/* Glass Login Card */}
            <motion.div
              className="glass rounded-2xl p-8 backdrop-blur-lg border border-white/10 dark:border-white/5 mb-6"
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Email Input */}
                <motion.div variants={itemVariants}>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="filled"
                    icon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    }
                    required
                  />
                </motion.div>

                {/* Password Input */}
                <motion.div variants={itemVariants}>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="filled"
                    icon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    }
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="focus:outline-none text-text-secondary hover:text-text transition-colors"
                      >
                        {showPassword ? (
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2z" />
                          </svg>
                        )}
                      </button>
                    }
                    required
                  />
                </motion.div>

                {/* Remember & Forgot */}
                <motion.div
                  className="flex items-center justify-between"
                  variants={itemVariants}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-surface accent-primary"
                    />
                    <span className="text-sm text-text-secondary">
                      Remember me
                    </span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:text-primary-light transition-colors"
                  >
                    Forgot password?
                  </Link>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={itemVariants}>
                  <Button
                    fullWidth
                    variant="primary"
                    size="lg"
                    type="submit"
                    isLoading={isLoading}
                    className="relative group"
                  >
                    <motion.span
                      className="relative z-10"
                      initial={false}
                      animate={isLoading ? { opacity: 0 } : { opacity: 1 }}
                    >
                      Sign In
                    </motion.span>
                  </Button>
                </motion.div>

                {/* Divider */}
                <motion.div
                  className="flex items-center gap-3"
                  variants={itemVariants}
                >
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-text-secondary">OR</span>
                  <div className="flex-1 h-px bg-border" />
                </motion.div>

                {/* Social Login */}
                <motion.div
                  className="grid grid-cols-2 gap-3"
                  variants={itemVariants}
                >
                  <Button variant="secondary" className="text-sm">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </Button>

                  <Button variant="secondary" className="text-sm">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </Button>
                </motion.div>
              </form>
            </motion.div>

            {/* Sign Up Link */}
            <motion.p
              className="text-center text-text-secondary"
              variants={itemVariants}
            >
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary hover:text-primary-light font-semibold transition-colors"
              >
                Sign up here
              </Link>
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PremiumLoginPage;
