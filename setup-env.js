#!/usr/bin/env node

/**
 * Supabase Environment Setup Script
 * 
 * This script helps you create your .env.local file with the correct Supabase variables.
 * Run with: node setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🔧 Supabase Environment Setup\n');
  console.log('This will help you create your .env.local file.\n');
  console.log('You can find these values in your Supabase dashboard:');
  console.log('https://app.supabase.com → Your Project → Settings → API\n');

  try {
    // Get Supabase URL
    const supabaseUrl = await question('Enter your Supabase URL (https://xxx.supabase.co): ');
    
    // Get anon key
    const anonKey = await question('Enter your anon public key: ');
    
    // Get service role key
    const serviceKey = await question('Enter your service_role key: ');
    
    // Ask about allow-list mode
    const allowListMock = await question('Use mock allow-list? (y/n, default: y): ');
    const useMock = allowListMock.toLowerCase() !== 'n';

    // Create .env.local content
    const envContent = `# Supabase Configuration
# Generated on ${new Date().toISOString()}

# Public Supabase URL (safe for client-side use)
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}

# Public anonymous key (safe for client-side use)
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}

# Service role key (SERVER-SIDE ONLY - NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}

# Use mock allow-list for local development
ALLOWLIST_MOCK=${useMock}
`;

    // Write to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ .env.local file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Test signup at: http://localhost:3000/signup');
    console.log('3. Use one of these emails: max@tetrasan.de, anna@tetrasan.de, etc.');
    
    if (useMock) {
      console.log('\n🎯 Mock allow-list is enabled.');
      console.log('Allowed emails: max@tetrasan.de, anna@tetrasan.de, thomas@tetrasan.de, julia@tetrasan.de, michael@tetrasan.de, laura@tetrasan.de, daniel@tetrasan.de, sophie@tetrasan.de, lukas@tetrasan.de, emma@tetrasan.de');
    }

    console.log('\n🔒 Security reminder:');
    console.log('- .env.local is already in .gitignore');
    console.log('- Never commit this file to git');
    console.log('- Never share your service role key');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Check if .env.local already exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists!');
  console.log('This script will overwrite it.\n');
  
  rl.question('Continue? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      setupEnvironment();
    } else {
      console.log('Setup cancelled.');
      rl.close();
    }
  });
} else {
  setupEnvironment();
}
