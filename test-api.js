const axios = require('axios');
axios.post('http://localhost:8080/api/v1/auth/login', {
  email: 'admin@demo.local',
  password: 'ChangeMe123!'
}).then(res => {
  console.log('SUCCESS:', res.status, res.data);
}).catch(err => {
  console.error('ERROR:', err.response ? err.response.status : err.message);
  if (err.response) {
      console.error(err.response.data);
  }
});
