"use strict";
var express = require('express');
var multer = require('multer');
var path = require('path');
var uuid = require('uuid');
var redis = require('redis')
var bluebird = require('bluebird')
var fs = require('fs')
var router = express.Router();

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, './uploads')
  },
  filename: function(req, file, cb){
    //cb(null, Date.now() + path.extname(file.originalname)) // template: this renames to "current datetime + file type extension" only

    cb(null, uuid.v4() + '+' + Date.now() + '+' + file.originalname) //https://bit.ly/2J0AHuT
  }
})

var upload = multer({storage: storage})

function testCache(file) {
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
        content = data;

        console.log("\nCache command: SET Message");
        console.log("Cache respone: " +  await cacheConnection.setAsync(file, content));

        console.log("\nCache command: GET Message");
        console.log("Cache response : " +  await cacheConnection.getAsync(file));

        console.log("\nDeleting temp upload from server...")

      } catch(e) {
        reject(e);
      }
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

  testCache(req.files[0].filename)
    .then(() => {
      uniqueID = String(req.files[0].filename).split("+", 1)
      res.render('post', { title: 'Online Path Tracer', uuid: uniqueID });
    }).catch(error => {
      console.log(error)
      res.render('upload-fail', {title: 'Online Path Tracer', error_msg: error, error_code: JSON.stringify(error)})
      console.log("res.render complete")
    });
});

module.exports = router;
