const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('ChangeMe123!', 12);
console.log(hash);
