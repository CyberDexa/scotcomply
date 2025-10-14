// Quick test to verify email is sent on production
const https = require('https');

const testEmail = 'olabayomiayinde@gmail.com'; // Replace with your actual email

const data = JSON.stringify({
  email: testEmail
});

const options = {
  hostname: 'scotcomply.co.uk',
  path: '/api/auth/forgot-password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testing password reset email...');
console.log('📧 Sending to:', testEmail);
console.log('');

const req = https.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Response Status:', res.statusCode);
    console.log('📦 Response Body:', body);
    console.log('');
    console.log('🔍 Check your email inbox for:', testEmail);
    console.log('📬 Also check spam/junk folder');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.write(data);
req.end();
