/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#F0F4FF',  // Bluish-white (was slate-50)
                    100: '#E0EAFF', // Light blue-white (was slate-100)
                    200: '#C7D7FE', // Soft blue-gray (was slate-200)
                    300: '#A5B9F5', // Light blue-gray (was slate-300)
                    400: '#94A3B8', // slate-400
                    500: '#64748B', // slate-500 (Primary text/icons)
                    600: '#475569', // slate-600
                    700: '#334155', // slate-700
                    800: '#1E293B', // slate-800
                    900: '#0F172A', // slate-900 (Dark headings)
                },
                accent: {
                    indigo: '#4F46E5',  // For Payments
                    amber: '#D97706',   // For Maintenance (Muted)
                },
                success: '#059669', // Muted Emerald
                warning: '#D97706', // Muted Amber
                error: '#DC2626',   // Muted Red
                background: '#F0F4FF', // Bluish-white background
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
