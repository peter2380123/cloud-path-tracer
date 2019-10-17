const PT = require('../lib');

/** Add your tests here: **/
const TEST = {
  // Add tests here.
  sanity_check: () => {
    let scene = PT.Scene.fromJson('Dummy parameter');
    let camera = PT.Camera.new(
      scene,
      PT.Vec3.new(0.0, 0.0, 0.0),
      PT.Vec3.new(0.0, 1.0, 0.0),
      PT.Vec3.new(1.0, 0.0, 0.0),
      800,
      600
    );
    let image = PT.Camera.render(camera, 0, 0, 0, 0, 90.0, 1, 1);
    assert(PT.Image.getWidth(image) == 800);
    assert(PT.Image.getHeight(image) == 600);
  },
};

function assert(cond) {
  if (!cond) {
    throw new Error("Assertion failed.");
  }
}

failures = [];
Object.keys(TEST).forEach((name) => {

  message = "Running " + name + "... ";
  try {
    TEST[name]();
    message += "Passed";
  } catch (e) {
    message += "\n" + e.stack;
    message += "Failed";
    failures.push(name);
  }
  console.log(message);
});
if (failures.length > 0) {
  console.log("Test failures:");
  failures.forEach(name => {
    console.log(name);
  });
}
