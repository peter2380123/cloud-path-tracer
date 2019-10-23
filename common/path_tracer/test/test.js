const PT = require('../lib');

/** Add your tests here: **/
const TEST = {
  // Add tests here.
  sanity_check: () => {
    let scene = PT.SceneBuilder.new();
    scene = PT.SceneBuilder.intoScene(scene);

    PT.Scene.dump(scene);

    let camera = PT.Camera.new(
      scene,
      PT.Vec3.new(0.0, 0.0, 0.0),
      PT.Vec3.new(0.0, 1.0, 0.0),
      PT.Vec3.new(1.0, 0.0, 0.0),
    );
    let image = PT.Camera.render(camera, 0, 0, 0, 0, 800, 600, 90.0, 1, 1);
    assert(PT.Image.getWidth(image) == 800);
    assert(PT.Image.getHeight(image) == 600);

    PT.Image.delete(image);
    image = null;

    PT.Scene.delete(scene);
    scene = null;
  },
  test_valid_scene_description: () => {
    let desc = JSON.stringify({
      materials: [
        { type: "lambertian", fuzziness: 1.0, colour: { red: 0.5, green: 0.5, blue: 0.5, } },
      ],
      camera: {
        pos: {
          x: 0.0,
          y: 0.0,
          z: -1.0,
        },
        forward: {
          x: 0.0,
          y: 0.0,
          z: 1.0,
        },
        up: {
          x: 0.0,
          y: 1.0,
          z: 0.0,
        }
      },
      scene: [
        {
          type: "sphere",
          material: 0,
          radius: 1.0,
          pos: {
            x: 0.0,
            y: 0.0,
            z: 0.0,
          }
        },
      ],
    });

    let s = PT.JSON.checkValid(desc);
    let camera = PT.JSON.parseValid(s);

    let image = PT.Camera.render(camera, 0, 0, 0, 0, 200, 100, 90.0, 1, 1);

    assert(PT.Image.getWidth(image) == 200);
    assert(PT.Image.getHeight(image) == 100);

    PT.Camera.delete(camera);
    PT.Image.delete(image);
  },
  test_invalid_scene_description_empty: () => {
    let desc = "";
    assert(!PT.JSON.checkValid(desc).success);
  },
  test_invalid_scene_description_missing_materials: () => {
    let desc = JSON.stringify({
      camera: {
        pos: {
          x: 0.0,
          y: 0.0,
          z: -1.0,
        },
        forward: {
          x: 0.0,
          y: 0.0,
          z: 1.0,
        },
        up: {
          x: 0.0,
          y: 1.0,
          z: 0.0,
        }
      },
      scene: [
        {
          type: "sphere",
          material: 0,
          radius: 1.0,
          pos: {
            x: 0.0,
            y: 0.0,
            z: 0.0,
          }
        },
      ],
    });
    assert(!PT.JSON.checkValid(desc).success);
  },
  test_out_of_bounds_material: () => {
    let desc = JSON.stringify({
      camera: {
        pos: {
          x: 0.0,
          y: 0.0,
          z: -1.0,
        },
        forward: {
          x: 0.0,
          y: 0.0,
          z: 1.0,
        },
        up: {
          x: 0.0,
          y: 1.0,
          z: 0.0,
        }
      },
      scene: [
        {
          type: "sphere",
          material: 1,
          radius: 1.0,
          pos: {
            x: 0.0,
            y: 0.0,
            z: 0.0,
          }
        },
      ],
    });
    assert(!PT.JSON.checkValid(desc).success);
  }
  // TODO: Need more validation at some point. We've only tested a tiny portion of possible failures.
};

function assert(cond) {
  if (!cond) {
    throw new Error("Assertion failed.");
  }
}

failures = [];
Object.keys(TEST).forEach((name) => {

  console.log("Running " + name);
  try {
    TEST[name]();
    console.log("... Passed");
  } catch (e) {
    console.log(e.stack);
    console.log("... Failed");
    failures.push(name);
  }
});
if (failures.length > 0) {
  console.log("Test failures:");
  failures.forEach(name => {
    console.log(name);
  });
}
