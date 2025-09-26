// Professional Inventory Management Theme
// Modern color palette and design utilities for InventoryPro

export const theme = {
  // Color Palette
  colors: {
    // Primary colors (Blue theme)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',     // Main primary
      600: '#2563eb',     // Primary brand
      700: '#1d4ed8',     // Dark variant
      800: '#1e40af',     // Darker blue
      900: '#1e3a8a',     // Very dark blue
      950: '#172554'
    },
    
    // Secondary colors (Slate/Gray)
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',     // Main secondary
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    },
    
    // Success colors (Green)
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Main success
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    },

    // Warning colors (Amber)
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Main warning
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03'
    },

    // Danger/Error colors (Red)
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Main danger
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },

    // Accent colors (Purple)
    accent: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7', // Main accent
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764'
    },

    // Neutral colors (True gray)
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a', // Main neutral
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b'
    }
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }]
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    }
  },

  // Spacing
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',   // 48px
    '4xl': '4rem',   // 64px
    '5xl': '5rem',   // 80px
    '6xl': '6rem'    // 96px
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px'
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  },

  // Component-specific styles
  components: {
    // Button variants
    button: {
      primary: {
        bg: 'bg-primary-600',
        hover: 'hover:bg-primary-700',
        text: 'text-white',
        shadow: 'shadow-sm',
        hoverShadow: 'hover:shadow-md'
      },
      success: {
        bg: 'bg-success-600',
        hover: 'hover:bg-success-700',
        text: 'text-white',
        shadow: 'shadow-sm',
        hoverShadow: 'hover:shadow-md'
      },
      warning: {
        bg: 'bg-warning-500',
        hover: 'hover:bg-warning-600',
        text: 'text-white',
        shadow: 'shadow-sm',
        hoverShadow: 'hover:shadow-md'
      },
      danger: {
        bg: 'bg-danger-600',
        hover: 'hover:bg-danger-700',
        text: 'text-white',
        shadow: 'shadow-sm',
        hoverShadow: 'hover:shadow-md'
      }
    },

    // Card styles
    card: {
      base: {
        bg: 'bg-white',
        shadow: 'shadow-sm',
        border: 'border border-neutral-200',
        rounded: 'rounded-lg',
        backdrop: 'backdrop-blur-none'
      },
      primary: {
        bg: 'bg-primary-50',
        shadow: 'shadow-sm',
        border: 'border border-primary-200',
        rounded: 'rounded-lg',
        backdrop: 'backdrop-blur-none'
      },
      accent: {
        bg: 'bg-accent-600',
        shadow: 'shadow-lg',
        border: 'border border-accent-700',
        rounded: 'rounded-lg',
        backdrop: 'backdrop-blur-none'
      }
    },

    // Input styles
    input: {
      base: {
        bg: 'bg-white',
        border: 'border border-slate-300',
        rounded: 'rounded-lg',
        focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        text: 'text-slate-900',
        placeholder: 'placeholder:text-slate-500'
      }
    }
  },

  // Status colors for inventory items
  inventoryStatus: {
    inStock: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: 'OK'
    },
    lowStock: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: '!'
    },
    outOfStock: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: 'X'
    },
    overStock: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: 'STOCK'
    }
  },

  // Priority levels
  priority: {
    low: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      color: '#64748b'
    },
    medium: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      color: '#f59e0b'
    },
    high: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      color: '#f97316'
    },
    critical: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      color: '#ef4444'
    }
  }
};

// Utility functions
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'in stock':
    case 'available':
      return theme.inventoryStatus.inStock;
    case 'low stock':
    case 'low':
      return theme.inventoryStatus.lowStock;
    case 'out of stock':
    case 'unavailable':
      return theme.inventoryStatus.outOfStock;
    case 'over stock':
    case 'excess':
      return theme.inventoryStatus.overStock;
    default:
      return theme.inventoryStatus.inStock;
  }
};

export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'low':
      return theme.priority.low;
    case 'medium':
    case 'moderate':
      return theme.priority.medium;
    case 'high':
      return theme.priority.high;
    case 'critical':
    case 'urgent':
      return theme.priority.critical;
    default:
      return theme.priority.low;
  }
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-IN').format(number || 0);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Chart color schemes
export const chartColors = {
  primary: [
    '#3b82f6', '#1d4ed8', '#60a5fa', '#93c5fd', '#bfdbfe'
  ],
  success: [
    '#10b981', '#047857', '#34d399', '#6ee7b7', '#a7f3d0'
  ],
  mixed: [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#64748b'
  ],
  gradient: [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Emerald  
    'rgba(245, 158, 11, 0.8)',   // Amber
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(249, 115, 22, 0.8)',   // Orange
    'rgba(6, 182, 212, 0.8)',    // Cyan
    'rgba(132, 204, 22, 0.8)',   // Lime
  ]
};

export default theme;