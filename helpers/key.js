const crypto = require('crypto');
const encryptionKey = crypto.randomBytes(32).toString('base64');
console.log(encryptionKey);