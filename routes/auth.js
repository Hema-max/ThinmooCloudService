const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios'); // ✅ add this
const { User } = require('../models');
require('dotenv').config();

// 🔹 Login API (get access token)
router.get('/login', async (req, res) => {
  try {
    const appId = '8fc3b61f72a649339a5426be8ca59fe4';
    const appSecret = '5c30faa8a5c774148e3e3f181cc3aaee';

    const url = `https://api-cloud.thinmoo.com/platCompany/extapi/getAccessToken?appId=${appId}&appSecret=${appSecret}`;

    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching token:', error.message);
    res.status(500).json({ error: 'Failed to get access token' });
  }
});

module.exports = router;
