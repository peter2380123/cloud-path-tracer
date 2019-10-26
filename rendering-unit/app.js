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
 *  render_options: {
 *    region: ? {
 *      top_left: [ number, number ],
 *      height: number,
 *      width: number,
 *    height: number,
 *    width: number,
 *    fov: number,
 *    bounces: number,
 *    samples_per_pixel: number,
 *    },
 *  },
 * }
 *
 * An example of a basic scene:
 * curl localhost:3000 --header "Content-Type: application/json" --request POST --data '{"bucket":"BUCKET_NAME","cache":"CACHE_NAME", "cacheKey": "CACHE_KEY", "uuid":"SCENE_UUID","render_options":{"height":600,"width":800,"fov":90,"bounces":10,"samples_per_pixel":10}}'
 */
app.post('/', (req, res) => {
  let bucket = req.body.bucket;
  let cache = req.body.cache;
  let cache_port = req.body.cachePort;
  let cache_key = req.body.cacheKey;
  let scene_uuid = req.body.uuid;
  let render_options = req.body.render_options;

  if (!bucket || !cache || !cache_port || !cache_key || !scene_uuid || !render_options) {
    res.status(400).send("Bad request parameters");
  }
  // Validate render options.
  if (!render_options.height || !render_options.width || !render_options.fov || !render_options.bounces || !render_options.samples_per_pixel) {
    res.status(400).send("Missing options in render options.");
  }
  render_options.region = render_options.region || { top_left: [0, 0], height: 0, width: 0 };
  let region = render_options.region;
  if (!region.top_left || region.top_left.length !== 2 || region.height === undefined || region.width === undefined) {
    res.status(400).send("Missing options in region options.");
  }


  // Grab scene information from the redis cache.
  const redisClient = redis.createClient(cache_port, cache, { auth_pass: cache_key, tls: cache });
  redisClient.on('error', err => {
    console.log(err);
    res.status(500).send("Issue with the Redis cache.");
  });

  redisClient.getAsync(scene_uuid)
    .then(scene_information => {
      return new Promise((resolve, reject) => {
        let valid = PT.JSON.checkValid(scene_information);
        if (!valid.success) {
          console.log(valid.reason);
          res.status(400).send("Bad scene information");
          return;
        }

        let camera = PT.JSON.parseValid(valid);

        console.log("Rendering:");
        //PT.Camera.dump(camera);

        let image = PT.Camera.render(camera, 
          region.top_left[0], region.top_left[1], 
          region.width,
          region.height, 
          render_options.width, 
          render_options.height,
          render_options.fov, 
          render_options.bounces,
          render_options.samples_per_pixel);

        console.log("Done!");


        // Build an image buffer.
        const image_width = PT.Image.getWidth(image);
        const image_height = PT.Image.getHeight(image);
        /*
          // (R, G, B) tuples.
      let bufferData = new Array(render_options.height * render_options.width * 3);

      console.log("Starting conversion to buffer");
      for (let i = 0; i < image_width; ++i) {
        for (let j = 0; j < image_height; ++j) {
          let pixel = PT.Image.getPixel(image, i, j);
          bufferData.push(pixel.red);
          bufferData.push(pixel.green);
          bufferData.push(pixel.blue);
        }
      }

      PT.Camera.delete(camera);
      camera = null;

      console.log("Converting to base64");
      let buffer = Buffer.from(bufferData).toString('base64');
      */

        // For now, in phase 2, we'll just generate the image here.
        let png = new PNG({ width: image_width, height: image_height });
        for (let y = 0; y < image_height; ++y) {
          for (let x = 0; x < image_width; ++x) {
            let idx = (image_width * y + x) * 4;

            let pixel = PT.Image.getPixel(image, x, y);

            png.data[idx + 0] = pixel.red;
            png.data[idx + 1] = pixel.green;
            png.data[idx + 2] = pixel.blue;
            png.data[idx + 3] = 0xFF;
          }
        } 

        const out_file_name = 'out-' + scene_uuid + '.png';

        png.pack().pipe(fs.createWriteStream(out_file_name)).on('finish', () => {
          console.log("Done writing PNG image!");
          resolve(new AWS.S3.ManagedUpload({
            params: {
              Bucket: bucket,
              Key: scene_uuid + ".png",
              Body: fs.createReadStream(out_file_name),
            }
          }).promise());
          //const params = { Bucket: bucket, Key: scene_uuid, Body: buffer };
          //console.log(`Done! Putting ${JSON.stringify(params)}`);
          //resolve(new AWS.S3({ apiVersion: '2006-03-01'}).putObject(params).promise());
        });
      })
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
