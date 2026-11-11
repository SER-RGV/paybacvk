extends "res://tests/test_case.gd"
## Unit tests for CameraMath: pure geometry for zoom, pitch, yaw, orbit and pan.

const CameraMath := preload("res://src/camera/camera_math.gd")


func test_zoom_is_clamped_to_range() -> void:
	assert_near(CameraMath.clamp_zoom(100.0, 8.0, 40.0), 40.0, 0.0001, "clamped to max")
	assert_near(CameraMath.clamp_zoom(1.0, 8.0, 40.0), 8.0, 0.0001, "clamped to min")
	assert_near(CameraMath.clamp_zoom(20.0, 8.0, 40.0), 20.0, 0.0001, "in-range value untouched")


func test_zoom_step_direction() -> void:
	var out := CameraMath.apply_zoom_step(10.0, 1, 0.1)
	var inward := CameraMath.apply_zoom_step(10.0, -1, 0.1)
	assert_true(out > 10.0, "positive direction zooms out (larger view)")
	assert_true(inward < 10.0, "negative direction zooms in")
	assert_near(CameraMath.apply_zoom_step(10.0, 0, 0.1), 10.0, 0.0001, "zero direction is a no-op")


func test_zoom_in_then_out_returns_to_start() -> void:
	var value := CameraMath.apply_zoom_step(22.0, -1, 0.12)
	value = CameraMath.apply_zoom_step(value, 1, 0.12)
	assert_near(value, 22.0, 0.0001, "symmetric zoom steps round-trip")


func test_pitch_is_clamped() -> void:
	assert_near(CameraMath.clamp_pitch(5.0, 20.0, 70.0), 20.0, 0.0001, "low pitch clamped")
	assert_near(CameraMath.clamp_pitch(90.0, 20.0, 70.0), 70.0, 0.0001, "high pitch clamped")


func test_yaw_wraps_into_0_360() -> void:
	assert_near(CameraMath.wrap_yaw(-90.0), 270.0, 0.0001, "negative wraps up")
	assert_near(CameraMath.wrap_yaw(725.0), 5.0, 0.0001, "large value wraps down")
	assert_near(CameraMath.wrap_yaw(45.0), 45.0, 0.0001, "in-range unchanged")


func test_orbit_offset_has_requested_distance() -> void:
	var offset := CameraMath.orbit_offset(37.0, 35.264, 100.0)
	assert_near(offset.length(), 100.0, 0.001, "offset length equals distance")


func test_orbit_offset_elevation_matches_pitch() -> void:
	var offset := CameraMath.orbit_offset(12.0, 30.0, 10.0)
	assert_near(offset.y, 5.0, 0.0001, "height is distance * sin(pitch)")


func test_ground_axes_are_orthogonal_and_unit() -> void:
	for yaw in [0.0, 45.0, 133.0, 270.0]:
		var forward := CameraMath.ground_forward(yaw)
		var right := CameraMath.ground_right(yaw)
		assert_near(forward.dot(right), 0.0, 0.0001, "forward and right are perpendicular at yaw %s" % yaw)
		assert_near(forward.length(), 1.0, 0.0001, "forward is unit length")
		assert_near(right.length(), 1.0, 0.0001, "right is unit length")


func test_yaw_zero_looks_down_negative_z() -> void:
	var forward := CameraMath.ground_forward(0.0)
	var right := CameraMath.ground_right(0.0)
	assert_near(forward.z, -1.0, 0.0001, "forward is -Z at yaw 0")
	assert_near(right.x, 1.0, 0.0001, "right is +X at yaw 0")


func test_pan_up_moves_forward_and_right_moves_right() -> void:
	var up := CameraMath.pan_delta(Vector2(0.0, -1.0), 0.0, 2.0)
	assert_near(up.z, -2.0, 0.0001, "pan up moves toward -Z at yaw 0")
	var right := CameraMath.pan_delta(Vector2(1.0, 0.0), 0.0, 2.0)
	assert_near(right.x, 2.0, 0.0001, "pan right moves toward +X at yaw 0")


func test_pan_follows_rotation() -> void:
	var before := CameraMath.pan_delta(Vector2(0.0, -1.0), 0.0, 1.0)
	var after := CameraMath.pan_delta(Vector2(0.0, -1.0), 90.0, 1.0)
	assert_true(before.distance_to(after) > 0.5, "same input pans differently after rotation")
	assert_near(after.length(), 1.0, 0.0001, "pan magnitude unaffected by yaw")


func test_clamp_to_bounds_limits_pivot() -> void:
	var bounds := Rect2(-10.0, -10.0, 20.0, 20.0)
	var clamped := CameraMath.clamp_to_bounds(Vector3(50.0, 3.0, -50.0), bounds)
	assert_near(clamped.x, 10.0, 0.0001, "x clamped to max")
	assert_near(clamped.z, -10.0, 0.0001, "z clamped to min")
	assert_near(clamped.y, 3.0, 0.0001, "y preserved")
