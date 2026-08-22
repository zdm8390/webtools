import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function xmlSaverPlugin() {
  return {
    name: 'xml-saver-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-xml', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              if (body) {
                const publicXmlPath = path.resolve(__dirname, 'public/kenketsu_data.xml');
                fs.writeFileSync(publicXmlPath, body, 'utf-8');

                const rootXmlPath = path.resolve(__dirname, 'kenketsu_data.xml');
                if (fs.existsSync(rootXmlPath)) {
                  fs.writeFileSync(rootXmlPath, body, 'utf-8');
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, message: 'XML saved successfully' }));
                return;
              }
            } catch (err) {
              console.error('Error saving XML file:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
              return;
            }
          });
        } else {
          next();
        }
      });
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), xmlSaverPlugin()],
  base: './',
  server: {
    port: 3000,
    open: false,
    watch: {
      ignored: ['**/kenketsu_data.xml', '**/public/kenketsu_data.xml']
    }
  }
})

