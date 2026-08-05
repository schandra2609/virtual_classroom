import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 3000,
        host: true,
        allowedHosts: true,
        https: {
            key: fs.readFileSync(path.resolve(__dirname, '../192.168.29.253+3-key.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, '../192.168.29.253+3.pem')),
        }
    }
})