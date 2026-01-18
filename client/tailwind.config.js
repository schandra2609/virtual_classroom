/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        screens: {
            xs: '480px',
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
            '2xl': '1536px',
        },
        extend: {
            fontFamily: {
                times: [ 'Times New Roman', 'serif' ],
                arial: [ 'Arial', 'sans-serif', 'Helvatica' ],
                code: [ 'Courier New' ],
                cambria: [ 'Cambria' ],
                mono: [ 'monospace' ]
            },
        },
    },
    plugins: [],
};