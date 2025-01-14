/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#111827',
            p: {
              marginTop: '0.25em',
              marginBottom: '0.25em',
              lineHeight: '1.4',
              overflowWrap: 'break-word',
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              hyphens: 'auto',
            },
            'ul, ol': {
              marginTop: '0.25em',
              marginBottom: '0.25em',
              paddingLeft: '1.25em',
            },
            li: {
              marginTop: '0.125em',
              marginBottom: '0.125em',
            },
            pre: {
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              padding: '0.5em',
              backgroundColor: '#f8fafc',
              borderRadius: '0.375rem',
              color: '#1e293b',
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
            code: {
              color: '#dc2626',
              backgroundColor: '#f1f5f9',
              padding: '0.15em 0.3em',
              borderRadius: '0.25rem',
              fontWeight: '400',
              wordBreak: 'break-word',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            a: {
              color: '#2563eb',
              textDecoration: 'underline',
              overflowWrap: 'break-word',
              '&:hover': {
                color: '#1d4ed8',
              },
            },
            blockquote: {
              borderLeftWidth: '3px',
              borderLeftColor: '#e2e8f0',
              paddingLeft: '0.75em',
              fontStyle: 'italic',
              marginLeft: 0,
              marginRight: 0,
              color: '#475569',
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};