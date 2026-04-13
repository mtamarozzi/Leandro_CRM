import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      // O plugin do TanStack Router precisa vir ANTES do plugin React.
      // Ele observa arquivos em src/routes/ e gera src/routeTree.gen.ts automaticamente.
      TanStackRouterVite({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: './src/routes',
        generatedRouteTree: './src/routeTree.gen.ts',
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR controlado por variável de ambiente (mantém compatibilidade com agentes
      // que editam arquivos enquanto o dev server roda).
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
