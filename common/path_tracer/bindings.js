const path = require('path');
var ref = require('ref')
var StructType = require('ref-struct')
var ffi = require('ffi')
const de = require('./deserialise');

/**
 *  Wrap the library using ffi 
 */
// typedefs
var Scene = ref.types.void; // we don't know what the layout of these structs looks like
var SceneBuilder = ref.types.void;
var Vec3 = ref.types.void;
var Camera = ref.types.void;
var Image = ref.types.void;
var Hit = ref.types.void;
var Material = ref.types.void;

var Scene_ptr = ref.refType(Scene);
var SceneBuilder_ptr = ref.refType(SceneBuilder);
var Vec3_ptr = ref.refType(Vec3);
var Camera_ptr = ref.refType(Camera);
var Image_ptr = ref.refType(Image);
var Material_ptr = ref.refType(Material);
var Hit_ptr = ref.refType(Hit);

var Pixel = StructType({
  red: ref.types.uint8,
  green: ref.types.uint8,
  blue: ref.types.uint8
});

/**
 * Define the symbols and signatures to load.
 */
var lib = ffi.Library(path.join(__dirname, 'path_tracer', 'target', 'release', 'libpath_tracer_ffi'), {
  "PT_Vec3_new": [Vec3_ptr, ['double', 'double', 'double']],
  "PT_Vec3_delete": ['void', [Vec3_ptr]],
  "PT_SceneBuilder_new": [SceneBuilder_ptr, []],
  "PT_SceneBuilder_add_object": ['void', [SceneBuilder_ptr, Hit_ptr]],
  "PT_SceneBuilder_into_scene": [Scene_ptr, [SceneBuilder_ptr]],
  "PT_Scene_delete": ['void', [Scene_ptr]],
  "PT_Scene_dump": ['void', [Scene_ptr]],
  "PT_Material_delete": ['void', [Material_ptr]],
  "PT_Material_Lambertian_new": [Material_ptr, ['double', 'double', 'double', 'float']],
  "PT_Material_Debugon_new": [Material_ptr, []],
  "PT_Hit_delete": ['void', [Hit_ptr]],
  "PT_Sphere_new": [Hit_ptr, ['double', 'double', 'double', 'double', Material_ptr]],
  "PT_Camera_new": [Scene_ptr, [Scene_ptr, Vec3_ptr, Vec3_ptr, Vec3_ptr]],
  "PT_Camera_render": [Image_ptr, [Camera_ptr, 'uint64', 'uint64', 'uint64', 'uint64', 'uint64', 'uint64', 'double', 'uint64', 'uint64']],
  "PT_Camera_dump": ['void', [Camera_ptr]],
  "PT_Camera_delete": ['void', [Camera_ptr]],
  "PT_Image_delete": ['void', [Image_ptr]],
  "PT_Image_get_pixel": [Pixel, [Image_ptr, 'uint64', 'uint64']],
  "PT_Image_get_height": ['uint64', [ Image_ptr ]],
  "PT_Image_get_width": ['uint64', [ Image_ptr ]],
});

/**
 * Automatically build module export names. The PT prefix is discarded. Then,
 * every upper camel case identifier is treated as a submodule. Finally, the
 * remaining part of the function name is converted to lower camel case.
 *
 * In this way, a function like PT_Image_get_pixel becomes
 * PT.Image.getPixel(...), a function like PT_Material_Debugon_new becomes
 * PT.Material.Debugon.new().
 *
 */

Object.keys(lib).map(name => {
  const split = name.split('_');
  const module_name = split[1];
  let submodules = [];
  for (let part of split.slice(2)) {
    if (part[0] === part[0].toUpperCase()) {
      submodules.push(part);
    } else {
      break;
    }
  }
  let function_name_split = split.slice(2 + submodules.length);
  let function_name = [ function_name_split[0], function_name_split.slice(1).map(v => v[0].toUpperCase() + v.slice(1))].join("");

  module.exports[module_name] = module.exports[module_name] || {};
  let depth = module.exports[module_name];
  for (let key of submodules) {
    depth[key] = depth[key] || {};
    depth = depth[key];
  }

  depth[function_name] = lib[name];
});

