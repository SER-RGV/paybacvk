extends RefCounted
## Pure camera maths with no scene dependencies. All angles are in degrees.
## Convention: yaw 0 looks toward -Z; positive yaw orbits the camera clockwise seen from above.

static func clamp_zoom(value: float, min_zoom: float, max_zoom: float) -> float:
	return clampf(value, min_zoom, max_zoom)


static func clamp_pitch(pitch_deg: float, min_pitch: float, max_pitch: float) -> float:
	return clampf(pitch_deg, min_pitch, max_pitch)


static func wrap_yaw(yaw_deg: float) -> float:
	return fposmod(yaw_deg, 360.0)


## direction > 0 zooms out (multiplies by 1 + ratio); direction < 0 zooms in; 0 is a no-op.
static func apply_zoom_step(current: float, direction: int, step_ratio: float) -> float:
	if direction == 0:
		return current
	return current * pow(1.0 + step_ratio, float(signi(direction)))


## Offset from the pivot to the camera, given yaw, pitch (elevation above the ground) and distance.
static func orbit_offset(yaw_deg: float, pitch_deg: float, distance: float) -> Vector3:
	var yaw := deg_to_rad(yaw_deg)
	var pitch := deg_to_rad(pitch_deg)
	return Vector3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch)) * distance


## Horizontal direction the camera looks along (from camera toward the pivot).
static func ground_forward(yaw_deg: float) -> Vector3:
	var yaw := deg_to_rad(yaw_deg)
	return Vector3(-sin(yaw), 0.0, -cos(yaw))


## Horizontal screen-right direction on the ground plane.
static func ground_right(yaw_deg: float) -> Vector3:
	var forward := ground_forward(yaw_deg)
	return Vector3(-forward.z, 0.0, forward.x)


## input.x: +1 right. input.y: +1 down (matches Input.get_vector with up/down actions).
static func pan_delta(input: Vector2, yaw_deg: float, distance: float) -> Vector3:
	var forward := ground_forward(yaw_deg)
	var right := ground_right(yaw_deg)
	return (right * input.x + forward * -input.y) * distance


static func clamp_to_bounds(point: Vector3, bounds: Rect2) -> Vector3:
	return Vector3(
		clampf(point.x, bounds.position.x, bounds.end.x),
		point.y,
		clampf(point.z, bounds.position.y, bounds.end.y)
	)
