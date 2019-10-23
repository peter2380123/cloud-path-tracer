const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const PT = require('./lib/path_tracer');

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
 *  scene_information: SceneDescription,
 *  render_options: {
 *    height: number,
 *    width: number,
 *    fov: number,
 *    bounces: number,
 *    samples_per_pixel: number,
 *  },
 * }
 *
 * To generate a test case:
 * curl localhost:3000 --header "Content-Type: application/json" --request POST --data '{"bucket":"BUCKET_NAME","render_options":{"height":800,"width":600,"fov":90,"bounces":10,"samples_per_pixel":10},"scene_information":{"materials":[{"type":"lambertian","fuzziness":1,"colour":{"red":0.5,"green":0.5,"blue":0.5}}],"camera":{"pos":{"x":0,"y":0,"z":-2},"forward":{"x":0,"y":0,"z":1},"up":{"x":0,"y":1,"z":0}},"scene":[{"type":"sphere","material":0,"radius":1,"pos":{"x":0,"y":0,"z":0}}]}}'
 */
app.post('/', (req, res, next) => {
  let bucket = req.body.bucket;
  let scene_information = req.body.scene_information;
  console.log(scene_information);
  let render_options = req.body.render_options;
  if (!bucket || !scene_information || !render_options) {
    res.status(400).send("Bad request parameters");
    return;
  }
  let valid = PT.JSON.checkValid(scene_information);
  if (!valid.success) {
    console.log(valid.reason);
    res.status(400).send("Bad scene information");
    return;
  }

  let camera = PT.JSON.parseValid(valid);
  
  console.log("Rendering:");
  PT.Camera.dump(camera);

  let image = PT.Camera.render(camera, 0, 0, 0, 0, render_options.width, render_options.height, render_options.fov, render_options.bounces, render_options.samples_per_pixel);

  console.log("Done!");

  // (R, G, B) tuples.
  let bufferData = new Array(render_options.height * render_options.width * 3);

  // Build an image buffer.
  const image_width = PT.Image.getWidth(image);
  const image_height = PT.Image.getHeight(image);

  console.log("Starting conversion to buffer");
  for (let i = 0; i < image_width; ++i) {
    for (let j = 0; j < image_height; ++j) {
      let pixel = PT.Image.getPixel(image, i, j);
      bufferData.push(pixel.red);
      bufferData.push(pixel.green);
      bufferData.push(pixel.blue);
    }
  }
  let buffer = Buffer.from(bufferData);
  console.log("Converting to base64");
  res.status(200).send(buffer.toString('base64'));

  PT.Camera.delete(camera);
  camera = null;
});

app.use((req, res, _next) => {
  res.status(500).send("OOPSIE WOOPSIE!! Uwu We made a mucky wucky!! A wittle mucko boingo! The code monkeys at our headquarters are working VEWY HAWD to fix this!");
});

module.exports = app;
