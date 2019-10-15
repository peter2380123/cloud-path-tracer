/**
 * @file PT.h
 *
 * Defines the interface for the C interface into the path tracing library.
 */
#include <stdint.h>
#include <stddef.h>

struct Scene;
struct Vec3;
struct Camera;
struct Image;

struct Pixel {
    uint8_t red;
    uint8_t green;
    uint8_t blue;
};

/// Create a 3-dimensional vector.
struct Vec3 *PT_Vec3_new(double x, double y, double z);

/// Create a Scene from a JSON scene specifier.
struct Scene *PT_Scene_from_json(const char *filename);

/// Create a camera for some scene.
struct Camera *PT_Camera_create(struct Scene *scene, struct Vec3 *origin, struct Vec3 *up, struct Vec3 *forward, size_t x_size, size_t y_size);

/// Render a portion of an image using some camera. If the arguments specifying
/// the portion of the image to render are all left at (size_t)-1, the entire image is
/// rendered in one portion.
struct Image *PT_Camera_render(struct Camera *self, size_t topleft_x, size_t topleft_y, size_t bottomright_x, size_t bottomright_y, double fov, size_t bounces, size_t samples_per_pixel);

/// Free the image.
void PT_Image_delete(struct Image *image);

/// Once we have an Image, get the colour of a certain pixel of it.
struct Pixel PT_Image_get_pixel(struct Image *image, size_t i, size_t j);
