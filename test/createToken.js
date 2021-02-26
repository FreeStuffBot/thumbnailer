
const payload = {
  gameid: '785037',
  tags: true
}

const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync('./private.key');
const token = jwt.sign(payload, privateKey, { algorithm: 'RS256'});
console.log('Token:')
console.log(token)
console.log('---')


const publicKey = fs.readFileSync('./public.key');
const decoded = jwt.verify(token, publicKey);
console.log('Validated:')
console.log(decoded)
console.log('---')
