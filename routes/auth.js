// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const axios = require('axios'); // ✅ add this
// require('dotenv').config();


// // 🔹 Login API (get access token)
// router.post('/login', async (req, res) => {
//   try {
//     const appId = '8fc3b61f72a649339a5426be8ca59fe4';
//     const appSecret = '5c30faa8a5c774148e3e3f181cc3aaee';

//     const url = `https://api-cloud.thinmoo.com/platCompany/extapi/getAccessToken?appId=${appId}&appSecret=${appSecret}`;

//     const response = await axios.get(url);
//     res.json(response.data);
//   } catch (error) {
//     console.error('Error fetching token:', error.message);
//     res.status(500).json({ error: 'Failed to get access token' });
//   }
// });

// module.exports = router;




const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();


// ⭐ FIX: Handle preflight OPTIONS request
router.options('/login', (req, res) => {
  res.sendStatus(200);
});

router.post('/login', async (req, res) => {
  try {
    const appId = '8fc3b61f72a649339a5426be8ca59fe4';
    const appSecret = '5c30faa8a5c774148e3e3f181cc3aaee';

    const url = `https://api-cloud.thinmoo.com/platCompany/extapi/getAccessToken?appId=${appId}&appSecret=${appSecret}`;

    const response = await axios.get(url);

    // response.data might be { code, msg, data } or { data: { accessToken, expiresIn } }
    const tokenData = response.data && (response.data.data || response.data);

    return res.status(200).json({
      success: true,
      data: tokenData
    });

  } catch (error) {
    console.error("Thinmoo Token API ERROR:", error?.response?.data || error.message || error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch access token",
      error: error?.response?.data || error.message || String(error)
    });
  }
});

module.exports = router;


