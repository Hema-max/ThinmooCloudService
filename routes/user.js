const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User } = require('../models');

router.get('/user', auth, async (req, res) => {
  try{
    const user = await User.findByPk(req.user.id, { attributes: ['id','name','email'] });
    if(!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  }catch(err){
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
