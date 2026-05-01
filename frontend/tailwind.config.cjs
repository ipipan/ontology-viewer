module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Map semantic names used previously to CSS variables defined in src/styles.css
        card: 'rgb(var(--tw-color-card) / <alpha-value>)',
        heading: 'rgb(var(--tw-color-heading) / <alpha-value>)',
        muted: 'rgb(var(--tw-color-muted) / <alpha-value>)',
        'base-100': 'rgb(var(--tw-color-base-100) / <alpha-value>)',
        'base-200': 'rgb(var(--tw-color-base-200) / <alpha-value>)',
        primary: {
          600: 'rgb(var(--tw-color-primary) / <alpha-value>)'
        },
        error: {
          50: 'rgb(var(--tw-color-error-50) / <alpha-value>)'
        }
      }
    }
  },
  plugins: []
};
