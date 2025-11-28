const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next){
  const auth = req.headers['authorization'];
  if(!auth) return res.status(401).json({ message: 'No token provided' });
  const parts = auth.split(' ');
  if(parts.length !== 2) return res.status(401).json({ message: 'Token error' });
  const token = parts[1];
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if(err) return res.status(401).json({ message: 'Token invalid' });
    req.user = decoded;
    next();
  });
};
