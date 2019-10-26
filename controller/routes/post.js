"use strict";
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
        resolve();
      })
    })
  });
}

/* GET users listing. */
router.post('/', upload.any(), function(req, res, next) {
  console.log("filename is: " + req.files[0].filename)

  upload2Cache(req.files[0].filename)
    .then(() => {

      const uniqueID = String(req.files[0].filename);
      console.log("Posting job to RU...")
      console.log(process.env.RUIP);

      res.redirect('/renders/' + uniqueID);
      console.log("Success page redirect") 

      axios.post(process.env.RUIP, {
        bucket: process.env.AWSBUCKETNAME,
        cache: process.env.REDISCACHEHOSTNAME, 
        cacheKey: process.env.REDISCACHEKEY,
        uuid: uniqueID,
        cachePort: process.env.CACHEPORT,
        /*
         * region: { top_left: [number, number], height: number, width: number } 
         */
      }).catch(_err => {
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
