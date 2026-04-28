const axios = require('axios');
async function test() {
  try {
    const login = await axios.post('http://localhost:5001/api/auth/login', { email: 'admin@naam.org', password: 'admin123' });
    const token = login.data.token;
    
    const res = await axios.post('http://localhost:5001/api/projects', {
      name: "Test Project",
      type_of_work: "Desilting",
      sub_type: "Desilting",
      source_type: "CSR",
      csr_id: 1
    }, { headers: { Authorization: `Bearer ${token}` }});
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
test();
