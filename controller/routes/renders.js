const router = require('express').Router();
const AWS = require('aws-sdk');

AWS.config.getCredentials(err => {
  if (err) {
    console.log(err);
    process.exit();
  }
});

router.get('/:uuid', (req, res, next) => {
  /*
  // Check to see if the key exists.
  //
  const bucket = process.env.AWSBUCKETNAME;
  const key = req.params.uuid + ".png";

  console.log(`Bucket: ${bucket}`);
  console.log(`key: ${key}`);

  let params = {
    Bucket: bucket,
    Key: key,
  };

  new AWS.S3().headObject(params).promise()
    .then(val => {
      return new Promise((resolve, reject) => {
        const url = `http://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
        res.render('finished-image', { image: url});
      });
    })
    .catch(err => {
      console.log("Caught an error");
      console.log(err);
      if (err.code === 'NotFound') {
        res.render('not-ready', { title: 'Online Path Tracer', uuid: req.params.uuid });
      } else {
        res.status(500).send("Issue when looking for image in bucket.");
      }
    })*/
  ////////
  const bucket = 'cloud-path-tracer-tiles';
  const key = req.params.uuid;
  let params = {
    Bucket : bucket,
    Key : key
  };

  new AWS.S3().headObject(params).promise()
    .then(val => {
      return new Promise((resolve, reject) => {
        const url = `http://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
        res.render('finished-image', {base64: url});
      });
    })
    .catch(err => {
      console.log("Caught an error");
      console.log(err);
      if (err.code === 'NotFound') {
        res.render('not-ready', { title: 'Online Path Tracer', uuid: req.params.uuid });
      } else {
        res.status(500).send("Issue when looking for image in bucket.");
      }
    })
  return
  ///////////
  res.send(`TODO: Send back collation page here for ${req.params.uuid}.`);
})

module.exports = router;
