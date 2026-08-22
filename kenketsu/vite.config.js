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
          req.setEncoding('utf8');
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              console.log(`[XML Saver Plugin] Received POST /api/save-xml request (${body.length} bytes)`);
              if (body && body.trim().length > 0) {
                const publicXmlPath = path.resolve(__dirname, 'public/kenketsu_data.xml');
                fs.writeFileSync(publicXmlPath, body, 'utf-8');

                const rootXmlPath = path.resolve(__dirname, 'kenketsu_data.xml');
                if (fs.existsSync(rootXmlPath)) {
                  fs.writeFileSync(rootXmlPath, body, 'utf-8');
                }

                console.log(`[XML Saver Plugin] Successfully wrote ${body.length} bytes to kenketsu_data.xml at ${new Date().toLocaleTimeString()}`);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, message: 'XML saved successfully' }));
              } else {
                console.error('[XML Saver Plugin] Error: Received empty body!');
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Empty body received' }));
              }
            } catch (err) {
              console.error('[XML Saver Plugin] File write error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          req.on('error', (err) => {
            console.error('[XML Saver Plugin] Request error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
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

