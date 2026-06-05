const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  try {
    const email = `api.test+${Date.now()}@example.com`;
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'API Test User',
        email,
        password: 'TestPass123!',
        societyCode: 'GRR-0001',
        role: 'staff'
      }),
    });
    const data = await res.json();
    console.log('status', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('err', e);
  }
})();
