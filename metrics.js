const client = require('prom-client')
const Registry = client.Registry
const register = new Registry()

client.collectDefaultMetrics({ register })

const counterRequests = new client.Counter({
  name: 'thumbnailer_total_requests',
  help: 'Keeps track of the total amount of incoming requests'
});
register.registerMetric(counterRequests)

const gaugeCachedImages = new client.Gauge({
  name: 'thumbnailer_cached_images',
  help: 'Shows the current amount of cached images'
});
register.registerMetric(gaugeCachedImages)
gaugeCachedImages.reset()

const histogramImageGenerationSeconds = new client.Histogram({
  name: 'thumbnailer_image_generation_seconds',
  help: 'Tracks the duration it took to generate images',
  labelNames: [ 'statusCode' ]
});
register.registerMetric(histogramImageGenerationSeconds)

module.exports.endpoint = async (_, res) => {
  res
    .status(200)
    .header({ 'Content-Type': 'text/plain' })
    .send(await register.metrics())
}

module.exports.tracker = {
  counterRequests,
  gaugeCachedImages,
  histogramImageGenerationSeconds
}
