"use strict";

const RENDERING_UNITS_PER_800x600x20x100_JOB = 2;

var express = require('express');
var multer = require('multer');
var path = require('path');
var uuid = require('uuid');
var redis = require('redis')
var bluebird = require('bluebird')
var fs = require('fs')
var axios = require('axios').default
var AWS = require('aws-sdk')
var pt = require(path.join(__dirname, '..','..', 'common', 'path_tracer'))
var router = express.Router();

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, './uploads')
  },
  filename: function(req, file, cb){
    cb(null, uuid.v4()) //https://bit.ly/2J0AHuT
  }
})

var upload = multer({storage: storage})

function upload2Cache(file) {
  return new Promise((resolve, reject) => {
    // Connect to the Azure Cache for Redis over the SSL port using the key.
    var cacheConnection = redis.createClient(6380, process.env.REDISCACHEHOSTNAME,{auth_pass: process.env.REDISCACHEKEY, tls: {servername: process.env.REDISCACHEHOSTNAME}});

    cacheConnection.on('error', function(err){
      console.log("Connection error.")
      reject(err);
      cacheConnection.quit()
    });

    let filepath = path.join(__dirname, '..', 'uploads', file);

    fs.readFile(filepath,'utf8', async function(err, data) {
      try {
        // console.log("Test content returns: " + typeof JSON.parse(data))
        let validity = await pt.JSON.checkValid(data)
        if(!validity.success){
          reject('File is not a valid JSON format.');
          console.log("File validity: FAILED")
        } else {
          console.log("File validity: PASSED");

          console.log("Now checking for render image options:");
          console.log(validity);
          let image = validity.description.image;
          if (!image || !image.fov || !image.width || !image.height || !image.samples_per_pixel || !image.bounces) {
            reject("Missing image option(s).");
            return;
          }

          console.log("\nCache command: SET Message");
          console.log("Cache respone: " +  await cacheConnection.setAsync(file, data)); 

          // We return the validated JSON.
          resolve(validity.description);
        }
      } catch(e) {
        reject(e);
      }
      console.log("\nDeleting temp upload from server...");
      fs.unlink(filepath, (err) => {
        if(err){
          reject(err);
        }
        console.log("Temporary upload deleted")
      })
    })
  });
}

/* GET users listing. */
router.post('/', upload.any(), function(req, res, next) {
  console.log("filename is: " + req.files[0].filename)

  upload2Cache(req.files[0].filename)
    .then((scene_info) => {

      const uniqueID = String(req.files[0].filename);
      console.log("Posting job to RU...")
      console.log(process.env.RUIP);

      res.redirect('/renders/' + uniqueID);
      console.log("Success page redirect");

      // Now, we split the image into multiple tiles.
      const WIDTH = scene_info.image.width;
      const HEIGHT = scene_info.image.height;
      const BOUNCES = scene_info.image.bounces;
      const SAMPLES_PER_PIXEL = scene_info.image.samples_per_pixel;

      const workbits_per_800x600x20x100_job = 800 * 600 * 20 * 100;

      const SENSITIVITY = workbits_per_800x600x20x100_job / RENDERING_UNITS_PER_800x600x20x100_JOB;

      const NUM_TILES = Math.ceil((WIDTH * HEIGHT * BOUNCES * SAMPLES_PER_PIXEL) / SENSITIVITY);
      console.log(NUM_TILES);

      const TILE_HEIGHT = Math.ceil(Math.sqrt(Math.pow(HEIGHT, 2) / NUM_TILES));
      const TILE_WIDTH = Math.ceil((WIDTH * TILE_HEIGHT) / HEIGHT);

      let promises = [];

      let metadata = [];

      for (let top_left_x = 0; top_left_x < WIDTH; top_left_x += TILE_WIDTH) {
        for (let top_left_y = 0; top_left_y < HEIGHT; top_left_y += TILE_HEIGHT) {

          let tile_width = Math.min(TILE_WIDTH, WIDTH - top_left_x);
          let tile_height = Math.min(TILE_HEIGHT, HEIGHT - top_left_y);

          const tileKey = `${uniqueID}-region-${top_left_x}-${top_left_y}`;

          console.log(`Adding tile for ${WIDTH}x${HEIGHT} image at (${top_left_x}, ${top_left_y}), of size ${tile_width}x${tile_height}`);
          promises.push(axios.post(process.env.RUIP, {
            bucket: process.env.AWSBUCKETNAME,
            cache: process.env.REDISCACHEHOSTNAME, 
            cacheKey: process.env.REDISCACHEKEY,
            uuid: uniqueID,
            cachePort: process.env.CACHEPORT,
            outputFormat: tileKey,
            region: { top_left: [top_left_x, top_left_y], height: tile_height, width: tile_width } 
          }));

          metadata.push({ key: tileKey, top_left: [top_left_x, top_left_y], width: tile_width, height: tile_height});
        }
      } 
      Promise.all(promises)
        .then(success => {
          // We only place the metadata _after_ all tiles are up. This way, we never end up with invalid metadata.
          return new AWS.S3().putObject({ Bucket: process.env.AWSBUCKETNAME, Key: uniqueID + "-metadata", Body: JSON.stringify(metadata)}).promise();
        })
        .catch(err => {
        console.log("Render failed with err " + err);
        console.log(err.stack);
        // Render failed.
        // TODO: See Issue #37.
      });
    }).catch(error => {
      console.log(error);
      res.render('upload-fail', {title: 'Online Path Tracer', error_msg: error, error_code: error.stack});
      console.log("Fail page rendered");
    });
});

module.exports = router;
