"use strict";
var express = require('express');
var multer = require('multer');
var path = require('path');
var uuid = require('uuid');
var redis = require('redis')
var bluebird = require('bluebird')
var fs = require('fs')
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
    cb(null, uuid.v4() + '+' + Date.now() + '+' + file.originalname) //https://bit.ly/2J0AHuT
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
          console.log("File validity: PASSED")

          console.log("\nCache command: SET Message");
          console.log("Cache respone: " +  await cacheConnection.setAsync(file, data));

          console.log("\nCache command: GET Message");
          console.log("Cache response : " +  await cacheConnection.getAsync(file));

          console.log("\nDeleting temp upload from server...")
        }
      } catch(e) {
        reject(e);
      }
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

function setupS3(){
  return new Promise((resolve, reject) => {
      // Create unique bucket name
    let bucketName = 'node-sdk-sample-' + uuid.v4();
    // Create name for uploaded object key
    // let keyName = 'hello_world.txt';

    // Create a promise on S3 service object
    let bucketPromise = new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: bucketName}).promise();

    // Handle promise fulfilled/rejected states
    // ... let's not put anything for now, and instead just do an easy resolve of bucketName
    /*
    bucketPromise.then(function(data){
      let objectParams = {Bucket: bucketName, Key: keyName, Body: 'Hewwo wowwd >w<'};
      // Create object upload promise
      let uploadPromise = new AWS.S3({apiVersion: '2006-03-01'}).putObject(objectParams).promise();
      uploadPromise.then(function(data){
        console.log("Successfully uploaded data to " + bucketName + "/" + keyName);
        resolve(bucketName);
      });
    }).catch(function(err){
      reject(err);
    });
    */
    bucketPromise.then(function(data){
      resolve(bucketName)
    }).catch(function(err){
      reject(err);
    })
  })
}


/* GET users listing. */
router.post('/', upload.any(), function(req, res, next) {
  console.log("filename is: " + req.files[0].filename)

  upload2Cache(req.files[0].filename)
    .then(() => {
      console.log("Running setupS3...")
      // create bucket, and for now we log the name of created bucket
      setupS3().then((whichBucket)=>{
        console.log("--- Destination S3 is: " + whichBucket + " ---")
      })

      let uniqueID = String(req.files[0].filename).split("+", 1)
      res.render('post', { title: 'Online Path Tracer', uuid: uniqueID });
      console.log("Success page rendered")
    }).catch(error => {
      console.log(error)
      res.render('upload-fail', {title: 'Online Path Tracer', error_msg: error, error_code: JSON.stringify(error)})
      console.log("Fail page rendered")
    });
});

module.exports = router;
