const assert = require('assert');
const { validationResult } = require('express-validator');
const { registerValidation } = require('../validators/requestValidators');

async function run() {
  const req = {
    body: {
      name: 'Test Resident',
      email: 'resident@example.com',
      password: 'Password123!',
      role: 'owner',
      societyCode: 'GRR-0001',
    },
  };

  await Promise.all(registerValidation.map((validation) => validation.run(req)));
  const result = validationResult(req);

  if (!result.isEmpty()) {
    console.error('Expected registration validation to pass without residence fields');
    console.error(result.array());
    process.exit(1);
  }

  console.log('Registration validation allows resident signup without wing/flat details');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
