const path = require('path');
// Load environment variables from backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const readline = require('readline');
const bcrypt = require('bcrypt');
const pool = require('../db');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    let password = '';

    // Enable raw mode to suppress echo
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();

    const onDataHandler = function (char) {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // EOF
          process.stdin.removeListener('data', onDataHandler);
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.stdin.removeListener('data', onDataHandler);
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdin.pause();
          process.exit();
          break;
        case '\u0008': // Backspace
        case '\u007f': // Delete
          password = password.slice(0, -1);
          break;
        default:
          // Do not echo or display anything
          password += char;
          break;
      }
    };
    process.stdin.on('data', onDataHandler);
  });
}

async function createSuperAdmin() {
  try {
    console.log('Create Super Admin - interactive');

    const envEmail = process.env.SUPER_ADMIN_EMAIL;
    const envPassword = process.env.SUPER_ADMIN_PASSWORD;
    const envName = process.env.SUPER_ADMIN_FULL_NAME;

    const email = envEmail || await ask('Super Admin email: ');
    const full_name = envName || await ask('Full name: ');
    const password = envPassword || await askHidden('Password (input hidden): ');

    if (!email || !password || !full_name) {
      console.error('Email, full name and password are required.');
      process.exit(1);
    }

    // Normalize email
    const normEmail = email.toLowerCase();

    // Check if user already exists
    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [normEmail]);
    if (rows && rows.length > 0) {
      console.error('A user with this email already exists. Aborting to prevent duplicate Super Admin.');
      process.exit(1);
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const role = 'super_admin';
    const status = 'active';

    const insertSql = `INSERT INTO users (name, email, password, role, status, is_verified) VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(insertSql, [full_name, normEmail, password_hash, role, status, 1]);

    if (result && result.insertId) {
      console.log('\nSuper Admin created successfully');
      console.log('Email:', normEmail);
      console.log('Password:', envPassword ? '******** (from env)' : password);
      console.log('User ID:', result.insertId);
      console.log('\nSecurity notes: Do not expose this script as a public registration endpoint.');
      process.exit(0);
    } else {
      console.error('Failed to insert Super Admin.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error creating Super Admin:', err.message || err);
    process.exit(1);
  }
}

createSuperAdmin();
