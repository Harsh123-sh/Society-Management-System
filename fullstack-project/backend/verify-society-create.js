const ctrl = require('./controllers/superAdminController');
const req = {
  body: {
    name: 'GRR Test Society',
    code: 'GRR-0001',
    societyCode: 'GRR-0001',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    contact_email: 'test@example.com',
    contact_phone: '9999999999',
    subscription_plan: 'starter',
  },
  user: { id: 1, role: 'super_admin' },
};
const res = {
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    console.log(JSON.stringify({ statusCode: this.statusCode, payload }, null, 2));
    if (!payload.success) process.exit(1);
  },
};
ctrl.createSociety(req, res).catch((err) => {
  console.error(err);
  process.exit(1);
});
