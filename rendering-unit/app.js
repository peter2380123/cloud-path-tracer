const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const PT = require(path.join(__dirname, '..', 'common', 'path_tracer'));
const bluebird = require('bluebird');
const PNG = require('pngjs').PNG;
const fs = require('fs');

const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const AWS = require('aws-sdk');

AWS.config.getCredentials(err => {
  if (err) {
    console.log(err);
    process.exit();
  }
});

const app = express();

app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/**
 * We only have a single route:
 *
 * POST to root, with the following JSON object in the body:
 *
 * {
 *  bucket: String,
 *  cache: String,
 *  cacheKey: String,
 *  cachePort: number,
 *  uuid: String,
 *  outputFormat: String,
 *  region: ? {
 *    top_left: [ number, number ],
 *    height: number,
 *    width: number,
 *  },
 * }
 *
 * An example of a basic scene can be found in ./example.sh.
 */
app.post('/', (req, res) => {
  let bucket = req.body.bucket;
  let cache = req.body.cache;
  let cache_port = req.body.cachePort;
  let cache_key = req.body.cacheKey;
  let scene_uuid = req.body.uuid;
  let output_format = req.body.outputFormat || "{{UUID}}-{{REGION_TOP_LEFT_X}}-{{REGION_TOP_LEFT_Y}}-{{REGION_WIDTH}}x{{REGION_HEIGHT}}";

  if (!bucket || !cache || !cache_port || !cache_key || !scene_uuid || !output_format) {
    res.status(400).send("Bad request parameters");
    return;
  }

  let region = req.body.region || { top_left: [0, 0], height: 0, width: 0 };
  if (!region.top_left || region.top_left.length !== 2 || region.height === undefined || region.width === undefined) {
    res.status(400).send("Missing options in region options.");
    return;
  }

  // Grab scene information from the redis cache.
  const redisClient = redis.createClient(cache_port, cache, { auth_pass: cache_key, tls: cache });
  redisClient.on('error', err => {
    console.log(err);
    res.status(500).send("Issue with the Redis cache.");
    return;
  });

  redisClient.getAsync(scene_uuid)
    .then(scene_information => {
      console.log(`Scene info at ${scene_uuid}`);
      console.log(scene_information);
      if (!scene_information) {
        res.status(400).send("Scene information not found.");
        return;
      }
      let valid = PT.JSON.checkValid(scene_information);
      if (!valid.success) {
        console.log("Rejecting:");
        console.log(valid.reason);
        res.status(400).send("Bad scene information");
        return;
      }

      let camera = PT.JSON.parseValid(valid);

        console.log("Rendering:");
        //PT.Camera.dump(camera);

        scene_information = valid.description;

        let image = PT.Camera.render(camera, 
          region.top_left[0], region.top_left[1], 
          region.width,
          region.height, 
          scene_information.image.width, 
          scene_information.image.height,
          scene_information.image.fov, 
          scene_information.image.bounces,
          scene_information.image.samples_per_pixel);

      console.log("Done!");


      // Build an image buffer.
      const image_width = PT.Image.getWidth(image);
      const image_height = PT.Image.getHeight(image);

      // (R, G, B) tuples.
      let bufferData = new Array(image_width * image_height * 3);

      console.log("Starting conversion to buffer");
      let idx = 0;
      for (let i = 0; i < image_width; ++i) {
        for (let j = 0; j < image_height; ++j) {
          let pixel = PT.Image.getPixel(image, i, j);
          bufferData[idx++] = pixel.red;
          bufferData[idx++] = pixel.green;
          bufferData[idx++] = pixel.blue;
        }
      }

      PT.Camera.delete(camera);
      camera = null;

      console.log("Converting to base64");
      let buffer = Buffer.from(bufferData).toString('base64');

      const key = output_format.toUpperCase()
        .replace("{{UUID}}", scene_uuid)
        .replace("{{REGION_TOP_LEFT_X}}", region.top_left[0])
        .replace("{{REGION_TOP_LEFT_Y}}", region.top_left[1])
        .replace("{{REGION_HEIGHT}}", region.height)
        .replace("{{REGION_WIDTH}}", region.width)
        .replace("{{HEIGHT}}", scene_information.image.height)
        .replace("{{WIDTH}}", scene_information.image.width)
        .toLowerCase();
      const params = { Bucket: bucket, Key: key, Body: buffer };
      //console.log(`Done! Putting ${JSON.stringify(params)}`);
      console.log(`Key was ${params.Key}`);

      return new AWS.S3({ apiVersion: '2006-03-01'}).putObject(params).promise();
    })
    .then((result) => {
      console.log("Successfully uploaded to bucket");
      res.status(200).send();
    })
    .catch(e => {
      console.log(e);
      res.status(500).send("Something went wrong.");
    }); 
});

app.use((req, res, _next) => {
  res.status(500).send("OOPSIE WOOPSIE!! Uwu We made a mucky wucky!! A wittle mucko boingo! The code monkeys at our headquarters are working VEWY HAWD to fix this!");
});

module.exports = app;
