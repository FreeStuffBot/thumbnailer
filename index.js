const express = require('express')
const { config: loadDotenv } = require('dotenv')
const isDocker = require('is-docker')
const { FreeStuffApi } = require('freestuff')

// Setup

if (!isDocker()) loadDotenv()

exports.api = new FreeStuffApi(process.env.NODE_ENV === 'dev'
  ? { key: process.env.FREESTUFF_KEY, baseUrl: 'http://localhost/v1/', type: 'partner', sid: '1' }
  : { key: process.env.FREESTUFF_KEY }
)
const { generateImage } = require('./generator.js')

const app = express()
const port = process.env.PORT || 5051
// app.use(require('morgan')('tiny'))
app.use(require('helmet')())
app.listen(port, () => console.log(`Server listening on port ${port}`))

// Server

app.get('/:token', async (req, res) => {
  if (!req.params.token) return res.status(400).end()

  const parsed = parseToken(req.params.token)
  if (!parsed)
    return res.status(401).json({ error: 'invalid token' })

  generateImage(parsed)
    .then(image => sendBuffer(image, res))
    // .catch(ex => res.status(ex.status || 500).json({ error: ex.message || 'internal server error' }))
    .catch(ex => console.error(ex))
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

function parseToken(token) {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString())
  } catch(ex) {
    return null
  }
}

