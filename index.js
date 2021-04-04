const express = require('express')
const { config: loadDotenv } = require('dotenv')
const isDocker = require('is-docker')
const { FreeStuffApi } = require('freestuff')
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Setup

if (!isDocker()) loadDotenv()

exports.api = new FreeStuffApi(process.env.NODE_ENV === 'dev'
  ? { key: process.env.FREESTUFF_KEY, baseUrl: 'http://localhost/api/v1/', type: 'partner', sid: '1' }
  : { key: process.env.FREESTUFF_KEY }
)
const { generateImage } = require('./generator.js')

const publicKey = fs.readFileSync('./public.key');


const app = express()
const port = process.env.PORT || 5051
app.use(require('morgan')('tiny'))
app.use(require('helmet')())
app.listen(port, () => console.log(`Server listening on port ${port}`))

// Server

let cache = new Map() /* <string, buffer> */
let cacheClear = new Map() /* <string, number> */

app.get('/:token', async (req, res) => {
  if (!req.params.token)
    return res.status(400).json({ error: 'missing token' })

  if (cache.has(req.params.token)) {
    cacheClear.set(req.params.token, 0)
    return void sendBuffer(cache.get(req.params.token), res)
  }

  const parsed = parseJWT(req.params.token)
  if (!parsed) return res.status(400).json({ error: 'invalid signature' })

  generateImage(parsed)
    .then(image => {
      cache.set(req.params.token, image)
      cacheClear.set(req.params.token, 0)
      sendBuffer(image, res)
    })
    .catch(ex => res
      .status(ex.status || 500)
      .json({ error: ex.message || 'internal server error' })
    )
})

app.get('/', (_, res) => res.redirect('https://github.com/FreeStuffBot/thumbnailer'))

app.all('*', (_, res) => {
  return res.status(404).json({ error: 'not found' })
})

//

function sendBuffer(base64, res) {
  const buffer = Buffer.from(base64, 'base64')
  res
    .status(200)
    .header({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    })
    .end(buffer)
}

function parseJWT(token) {
  try {
    return jwt.verify(token, publicKey);
  } catch(ex) {
    return null
  }
}

function swipeCache() {
  for (const key of cacheClear.keys()) {
    const current = cacheClear.get(key)
    if (current > 4) {
      cacheClear.delete(key)
      cache.delete(key)
    } else {
      cacheClear.set(key, current + 1)
    }
  }
}
setInterval(swipeCache, 1000 * 60 * 60)
