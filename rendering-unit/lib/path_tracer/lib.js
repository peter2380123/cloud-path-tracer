var ref = require('ref')
var StructType = require('ref-struct')
var ffi = require('ffi')

/**
 *  Wrap the library using ffi 
 */
// typedefs
var Scene = ref.types.void // we don't know what the layout of these structs looks like
var Vec3 = ref.types.void
var Camera = ref.types.void
var Image = ref.types.void

var Scene_ptr = ref.refType(Scene)
var Vec3_ptr = ref.refType(Vec3)
var Camera_ptr = ref.refType(Camera)
var Image_ptr = ref.refType(Image)

var Pixel = StructType({
  red: ref.types.uint8,
  green: ref.types.uint8,
  blue: ref.types.uint8
});

var lib = ffi.Library('path_tracer/target/debug/libpath_tracer_ffi', {
  "PT_Vec3_new": [Vec3_ptr, ['double', 'double', 'double']],
  "PT_Scene_from_json": [Scene_ptr, [ ref.types.CString ]],
  "PT_Camera_new": [Scene_ptr, [Scene_ptr, Vec3_ptr, Vec3_ptr, Vec3_ptr, 'uint64', 'uint64']],
  "PT_Camera_render": [Image_ptr, [Camera_ptr, 'uint64', 'uint64', 'uint64', 'uint64', 'double', 'uint64', 'uint64']],
  "PT_Image_delete": ['void', [Image_ptr]],
  "PT_Image_get_pixel": [Pixel, [Image_ptr, 'uint64', 'uint64']],
  "PT_Image_get_height": ['uint64', [ Image_ptr ]],
  "PT_Image_get_width": ['uint64', [ Image_ptr ]],
});

module.exports = {
  Vec3: {
    new: lib.PT_Vec3_new
  },
  Scene: {
    fromJson: lib.PT_Scene_from_json
  },
  Camera: {
    new: lib.PT_Camera_new,
    render: lib.PT_Camera_render
  },
  Image: {
    delete: lib.PT_Image_delete,
    getPixel: lib.PT_Image_get_pixel,
    getHeight: lib.PT_Image_get_height,
    getWidth: lib.PT_Image_get_width
  },
  Pixel: Pixel
}
