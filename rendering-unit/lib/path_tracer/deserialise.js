const b = require('./bindings');

/**
 * Check if a given object is valid as a scene object. Scene object should look like
 */
function isValidScene(scene, materials) {
  for (let hit of scene) {
    if (hit.type === "scene") {
      if (!isValidScene(hit, materials)) {
        return false;
      }
    } else if (hit.type === "sphere") {
      if (!isValidSphere(hit, materials)) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

function buildScene(scene, materials) {
  let sceneBuilder = b.SceneBuilder.new();
  for (let hit of scene) {
    if (hit.type.toLowerCase() === "sphere") {
      b.SceneBuilder.addObject(sceneBuilder, buildSphere(hit, materials));
    } else if (hit.type.toLowerCase() === "scene") {
      b.SceneBuilder.addObject(sceneBuilder, buildScene(hit, materials));
    }
  }
  return b.SceneBuilder.intoScene(sceneBuilder);
}

/**
 * Check if a given sphere is correct.
 */
function isValidSphere(sphere, materials) {
  if (sphere.radius === undefined || sphere.pos === undefined || sphere.pos.x === undefined || sphere.pos.y === undefined || sphere.pos.z === undefined || sphere.material === undefined) {
    return false;
  }
  if (!isValidMaterial(sphere.material, materials)) {
    return false;
  }
  return true;
}

function buildSphere(sphere, materials) {
  return b.Sphere.new(sphere.pos.x, sphere.pos.y, sphere.pos.z, sphere.radius, materials[sphere.material]);
}

/**
 * Check that a given material is correct.
 */
function isValidMaterial(material, materials) {
  return material < materials.length;
}

/**
 * Check that Debugon is correct.
 */
function isValidDebugon(_) {
  // Can't go wrong with Debugon.
  return true;
}

function buildDebugon() {
  return b.Material.Debugon.new();
}

/**
 * Check that a Lambertian material is correct.
 * Format is:
 * {
 *  fuzziness: number,
 *  colour: {
 *    red: number,
 *    green: number,
 *    blue: number,
 *  }
 * }
 */
function isValidLambertian(material) {

  if (typeof material.fuzziness !== 'number' || material.colour === undefined || typeof material.colour.red !== 'number' || typeof material.colour.green !== 'number' || typeof material.colour.blue !== 'number') {
    return false;
  }
  if (material.colour.red > 1.0 || material.colour.green > 1.0 || material.colour.blue > 1.0) {
    return false;
  }
  return true;
}

function buildLambertian(material) {
  return b.Material.Lambertian.new(material.colour.red, material.colour.green, material.colour.blue, material.fuzziness);
}

/**
 * Check that every material definition in the index is correct.
 */
function isValidMaterialsIndex(materials) {
  for (let material of materials) {
    if (material.type.toLowerCase() === "lambertian") {
      if (!isValidLambertian(material)) {
        return false;
      }
    } else if (material.type.toLowerCase() === "debugon") {
      if (!isValidDebugon(material)) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

function buildMaterialsIndex(materialsDesc) {
  let result = [];
  for (let material of materialsDesc) {
    if (material.type.toLowerCase() === "lambertian") {
      result.push(buildLambertian(material));
    } else if (material.type.toLowerCase() === "debugon") {
      result.push(buildDebugon());
    }
  }
  return result;
}

/**
 * Check if a scene description is valid.
 */
function isValidSceneAndCamera(description) {
  let obj = null;
  if (typeof description === 'object') {
    obj = description;
  } else {
    try {
      obj = JSON.parse(description);
    } catch (_) {
      // First possible failure: 
      return  { 
        success: false, 
        reason: "Invalid syntax."
      };
    }
  }

  if (!obj) {
    return {
      success: false,
      reason: "Resolves to an empty object.",
    };
  }

  let camera = obj.camera;

  if (!camera) {
    return {
      success: false,
      reason: "Missing mandatory `camera` field.",
    };
  }

  let camera_position = camera.pos;
  if (!camera_position || camera_position.x === undefined || camera_position.y === undefined || camera_position.z === undefined) {
    return {
      success: false,
      reason: "Camera's `pos` field is missing x, y, or z",
    };
  }
  let camera_up = camera.up;
  if (!camera_up || camera.up.x === undefined || camera.up.y === undefined || camera.up.z === undefined) {
    return {
      success: false,
      reason: "Camera's `up` field is missing x, y or z",
    }
  }
  let camera_forward = camera.forward;
  if (!camera_forward || camera.forward.x === undefined || camera.forward.y === undefined || camera.forward.z === undefined) {
    return {
      success: false,
      reason: "Camera's `forward` field is missing x, y or z",
    }
  }

  let materials = obj.materials;
  if (!materials) {
    return {
      success: false,
      reason: "Missing materials index.",
    };
  }

  // Now, we validate materials.
  if (!isValidMaterialsIndex(materials)) {
    return false;
  }

  let scene = obj.scene;
  if (!scene) {
    return {
      success: false,
      reason: "Missing `scene`, which should be an array of Hit.",
    }
  }

  if (!isValidScene(scene, materials)) {
    return { 
      success: false,
      description: "Invalid scene.",
    }
  }

  // At this point, we know all is good. Indicate as such.
  return {
    success: true,
    description: obj,
  };
}

function buildSceneAndCameraFromValidDescription(outputFromIsValidSceneDesc) {
  if (!outputFromIsValidSceneDesc.success) {
    throw new Error("Have you checked the scene with isValidSceneDesc?");
  }
  let sceneDesc = outputFromIsValidSceneDesc.description;

  let materials = buildMaterialsIndex(sceneDesc.materials);

  let scene = buildScene(sceneDesc.scene, materials);
  let camera = null;
  {

    console.log("SceneDesc");
    console.log(sceneDesc.camera);

    let origin = b.Vec3.new(sceneDesc.camera.pos.x, sceneDesc.camera.pos.y, sceneDesc.camera.pos.z);
    let up = b.Vec3.new(sceneDesc.camera.up.x, sceneDesc.camera.up.y, sceneDesc.camera.up.z);
    let forward = b.Vec3.new(sceneDesc.camera.forward.x, sceneDesc.camera.forward.y, sceneDesc.camera.forward.z); 

    camera = b.Camera.new(scene, origin, up, forward);

    b.Vec3.delete(up);
    b.Vec3.delete(forward);
    b.Vec3.delete(origin);
  }
  return camera;
}

module.exports = {
  isValidSceneAndCamera: isValidSceneAndCamera,
  buildSceneAndCameraFromValidDescription: buildSceneAndCameraFromValidDescription,
};
