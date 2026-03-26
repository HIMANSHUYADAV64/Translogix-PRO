const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 5000 });
    console.log(`Public URL established: ${tunnel.url}`);

    const envPath = path.join(__dirname, '../frontend/.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the VITE_API_URL with the new public tunnel URL
    envContent = envContent.replace(/VITE_API_URL=.*/g, `VITE_API_URL=${tunnel.url}`);
    fs.writeFileSync(envPath, envContent);
    console.log('Updated frontend/.env with global public URL.');

    console.log('Rebuilding frontend and syncing to Android...');
    execSync('npm run build && npx cap sync android', { 
        cwd: path.join(__dirname, '../frontend'), 
        stdio: 'inherit' 
    });
    
    console.log('Done! Keep this terminal open to keep the backend connected to the internet.');
    
    tunnel.on('close', () => {
      console.log('Tunnel closed.');
      process.exit(0);
    });
  } catch (e) {
    console.error('Error establishing tunnel:', e);
    process.exit(1);
  }
})();
