const colors = require('tailwindcss/colors');

module.exports = {
    content: ['./client/**/*.{js,jsx}', './client/**/*.html'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                hemmelig: {
                    DEFAULT: '#2a9d8f',
                    50: '#ffffff',
                    100: '#eaf5f4',
                    200: '#d4ebe9',
                    300: '#bfe2dd',
                    400: '#aad8d2',
                    500: '#95cec7',
                    600: '#7fc4bc',
                    700: '#6abab1',
                    800: '#55b1a5',
                    900: '#3fa79a',
                },
                'hemmelig-orange': {
                    DEFAULT: '#ff9769',
                    50: '#ffffff',
                    100: '#fff5f0',
                    200: '#ffeae1',
                    300: '#ffe0d2',
                    400: '#ffd5c3',
                    500: '#ffcbb4',
                    600: '#ffc1a5',
                    700: '#ffb696',
                    800: '#ffac87',
                    900: '#ffa178',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
};
