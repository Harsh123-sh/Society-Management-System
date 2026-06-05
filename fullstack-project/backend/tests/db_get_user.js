const userModel = require('../models/userModel');

(async ()=>{
  try{
    const u = await userModel.getUserById(15);
    console.log('user', u);
    process.exit(0);
  }catch(e){
    console.error('err', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
