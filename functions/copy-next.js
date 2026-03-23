const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../.next');
const destDir = path.join(__dirname, '.next');

// Remove existing .next inside functions if it exists
if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
}

// Copy the latest .next cache from root
if (fs.existsSync(srcDir)) {
    fs.cpSync(srcDir, destDir, { recursive: true });
    console.log('Successfully copied .next to functions/.next');
} else {
    console.warn('Warning: .next directory not found at ' + srcDir);
}

const envFile = path.join(__dirname, '../.env.local');
const destEnvFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
    fs.copyFileSync(envFile, destEnvFile);
    console.log('Successfully copied .env.local to functions/.env');
}
