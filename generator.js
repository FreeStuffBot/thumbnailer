const { createCanvas, loadImage, registerFont } = require('canvas')
const { api } = require('./index.js')

registerFont('./res/font.ttf', { family: 'defaultFont' })

const TAG_HEIGHT = 27
const IMG_BORDER_RADIUS = 5
const ELEMENT_MARGIN = 5


exports.generateImage = async (req) => {
  if (!req.gameid)
    throw { status: 400, message: 'missing game id' }

  const { [req.gameid]: data } = await api.getGameDetails([ req.gameid ], 'info')

  if (!data)
    throw { status: 400, message: 'invalid game id' }

  const props = {
    additionalHeight: 0,
    additionalWidth: 0,
    originOffsetX: 0,
    originOffsetY: 0,
    jobs: []
  }

  if ((req.tags || req.full) && data.tags && data.tags.length) {
    props.additionalHeight += TAG_HEIGHT + ELEMENT_MARGIN
    props.originOffsetY += TAG_HEIGHT + ELEMENT_MARGIN
    props.jobs.push(drawTags)
  }

  const imgbuffer = await loadImage(data.thumbnail.org)
  const canvas = createCanvas(imgbuffer.width + props.additionalWidth, imgbuffer.height + props.additionalHeight)
  const ctx = canvas.getContext('2d')
  const imgdimensions = [ props.originOffsetX, props.originOffsetY, imgbuffer.width, imgbuffer.height ]

  ctx.save();
  roundedPath(ctx, ...imgdimensions, IMG_BORDER_RADIUS);
  ctx.clip();
  ctx.drawImage(imgbuffer, ...imgdimensions)
  ctx.restore();

  props.jobs.forEach(j => j(ctx, props, data, req))

  const buffer = canvas.toBuffer('image/png', { compressionLevel: 3 })
  return Buffer.from(buffer, 'binary').toString('base64')
}

function drawTags(ctx, props, data, req) {
  let cursor = 0
  const CIRCLE_RAD = TAG_HEIGHT / 5 * 2
  const FONT_HEIGHT = TAG_HEIGHT - ELEMENT_MARGIN * 3
  const INNER_MARGIN = (TAG_HEIGHT - FONT_HEIGHT) / 2
  ctx.font = `${FONT_HEIGHT}px defaultFont`
  
  let tag = (name) => {
    const { width } = ctx.measureText(name)
    const tagBackground = [ cursor, 0, width + INNER_MARGIN * 2 + ELEMENT_MARGIN + CIRCLE_RAD, TAG_HEIGHT ]
    if (tagBackground[0] + tagBackground[2] > ctx.canvas.width) return

    roundedPath(ctx, ...tagBackground, IMG_BORDER_RADIUS)
    ctx.fillStyle = '#202225'
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(cursor + INNER_MARGIN + CIRCLE_RAD / 2, TAG_HEIGHT / 2, CIRCLE_RAD / 2, 0, 2 * Math.PI, false)
    ctx.closePath()
    const hue = [...name].reduce((prev, curr) => prev + curr.charCodeAt(0), 0)
    ctx.fillStyle = `hsl(${~~hue % 360}, 40%, 60%)`
    ctx.fill()

    ctx.fillStyle = '#dddddd'
    ctx.fillText(name, cursor + INNER_MARGIN + CIRCLE_RAD + ELEMENT_MARGIN, TAG_HEIGHT - (TAG_HEIGHT - FONT_HEIGHT) / 5 * 3)
    cursor += tagBackground[2] + ELEMENT_MARGIN
  }
  data.tags.map(t => t.toUpperCase()).forEach(tag)
}

//

function roundedPath(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}