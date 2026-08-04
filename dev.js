import { spawn } from 'child_process';

console.log('Starting Threat Detection Suite...');
console.log('Booting backend API server...');

// Start backend Express server (server.js) on port 5000
const backend = spawn('node', ['server.js'], { stdio: 'inherit', shell: true });

console.log('Booting Vite development server...');
// Start frontend server on port 3000
const frontend = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});

process.on('exit', () => {
  backend.kill();
  frontend.kill();
});
