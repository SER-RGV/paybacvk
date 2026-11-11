extends "res://tests/test_case.gd"
## Integration tests for the Phase 01 test scenario: clock, pause, speed, HUD, camera and input routing.
## Scenes are spawned into the live scene tree and driven through the same handlers that input uses.

const TestRangeController := preload("res://src/world/test_range_controller.gd")
const TacticalCamera := preload("res://src/camera/tactical_camera.gd")
const SimulationClock := preload("res://src/tactical/simulation_clock.gd")
const InputActions := preload("res://src/core/input_actions.gd")

const RANGE_SCENE := "res://scenes/test_range.tscn"

var _range: TestRangeController


func setup() -> void:
	Settings.reset_defaults()


func teardown() -> void:
	if _range != null and is_instance_valid(_range):
		if _range.get_parent() != null:
			_range.get_parent().remove_child(_range)
		_range.free()
	_range = null
	Settings.reset_defaults()


func _spawn_range() -> TestRangeController:
	var packed := load(RANGE_SCENE) as PackedScene
	_range = packed.instantiate() as TestRangeController
	scene_root.add_child(_range)
	return _range


func _action(action_name: String) -> InputEventAction:
	var event := InputEventAction.new()
	event.action = action_name
	event.pressed = true
	return event


func _button(node_name: String) -> Button:
	return _range.hud.find_child(node_name, true, false) as Button


func test_clock_advances_while_running() -> void:
	var controller := _spawn_range()
	var advanced: bool = await wait_for_condition(func() -> bool: return controller.clock.get_sim_time() > 0.0)
	assert_true(advanced, "simulated time advanced while running")


func test_pause_freezes_time_and_probe() -> void:
	var controller := _spawn_range()
	await wait_frames(3)
	controller.pause()
	var frozen_time := controller.clock.get_sim_time()
	var frozen_spin := controller.probe.rotation.y
	await wait_frames(6)
	assert_near(controller.clock.get_sim_time(), frozen_time, 0.000001, "sim time frozen while paused")
	assert_near(controller.probe.rotation.y, frozen_spin, 0.000001, "probe frozen while paused")


func test_resume_continues_after_pause() -> void:
	var controller := _spawn_range()
	controller.pause()
	await wait_frames(2)
	var frozen_time := controller.clock.get_sim_time()
	controller.resume()
	var moved: bool = await wait_for_condition(func() -> bool: return controller.clock.get_sim_time() > frozen_time)
	assert_true(moved, "time moves again after resume")


func test_probe_rotation_follows_simulation_time() -> void:
	var controller := _spawn_range()
	controller.pause()
	await wait_frames(1)
	controller.resume()
	controller.clock.advance(1.0)
	controller.pause()
	var expected_spin := controller.clock.get_sim_time() * TestRangeController.PROBE_SPIN_RAD_PER_SIM_SECOND
	assert_near(controller.probe.rotation.y, expected_spin, 0.0001, "probe rotation derived from sim time")


func test_pause_action_routes_to_clock_and_hud() -> void:
	var controller := _spawn_range()
	await wait_frames(1)
	controller._unhandled_input(_action(InputActions.PAUSE_TOGGLE))
	assert_true(controller.clock.is_paused(), "pause action pauses the clock")
	assert_eq(controller.hud.get_state_text(), "PAUSED", "HUD shows PAUSED")
	assert_eq(controller.hud.get_pause_button_text(), "Resume", "HUD button offers resume")
	controller._unhandled_input(_action(InputActions.PAUSE_TOGGLE))
	assert_false(controller.clock.is_paused(), "second press resumes")
	assert_eq(controller.hud.get_state_text(), "RUNNING", "HUD shows RUNNING")


func test_speed_actions_change_speed_and_report_limit() -> void:
	var controller := _spawn_range()
	await wait_frames(1)
	controller._unhandled_input(_action(InputActions.SPEED_UP))
	controller._unhandled_input(_action(InputActions.SPEED_UP))
	assert_near(controller.clock.get_speed(), 4.0, 0.0001, "two presses reach 4x")
	assert_eq(controller.hud.get_speed_text(), "Speed 4.0x", "HUD speed label updated")
	controller._unhandled_input(_action(InputActions.SPEED_UP))
	assert_eq(controller.hud.get_message_text(), TestRangeController.SPEED_LIMIT_MESSAGE, "limit feedback shown")
	controller._unhandled_input(_action(InputActions.SPEED_DOWN))
	assert_near(controller.clock.get_speed(), 2.0, 0.0001, "speed down works from the limit")


func test_hud_buttons_drive_the_controller() -> void:
	var controller := _spawn_range()
	await wait_frames(1)
	_button("PauseButton").pressed.emit()
	assert_true(controller.clock.is_paused(), "pause button pauses")
	_button("PauseButton").pressed.emit()
	assert_false(controller.clock.is_paused(), "pause button resumes")
	_button("FasterButton").pressed.emit()
	assert_near(controller.clock.get_speed(), 2.0, 0.0001, "faster button raises speed")
	_button("SlowerButton").pressed.emit()
	_button("SlowerButton").pressed.emit()
	assert_near(controller.clock.get_speed(), 0.5, 0.0001, "slower button lowers speed to 0.5x")


func test_hud_time_label_matches_clock_when_paused() -> void:
	var controller := _spawn_range()
	controller.clock.advance(3.0)
	controller.pause()
	await wait_frames(1)
	assert_eq(controller.hud.get_time_text(), "Sim time  " + SimulationClock.format_time(controller.clock.get_sim_time()), "HUD time label shows clock time")


func test_camera_zoom_action_changes_zoom_and_camera_size() -> void:
	var controller := _spawn_range()
	await wait_frames(1)
	var camera := controller.camera
	var before := camera.zoom
	camera._unhandled_input(_action(InputActions.ZOOM_IN))
	assert_true(camera.zoom < before, "zoom in reduces the view size")
	assert_near(camera.camera.size, camera.zoom, 0.0001, "orthographic size follows zoom")


func test_camera_zoom_is_clamped_at_both_ends() -> void:
	var controller := _spawn_range()
	await wait_frames(1)
	for _i in 200:
		controller.camera.zoom_by(-1)
	assert_near(controller.camera.zoom, TacticalCamera.MIN_ZOOM, 0.0001, "zoom stops at min")
	for _i in 200:
		controller.camera.zoom_by(1)
	assert_near(controller.camera.zoom, TacticalCamera.MAX_ZOOM, 0.0001, "zoom stops at max")


func test_camera_pan_stays_inside_bounds() -> void:
	var controller := _spawn_range()
	await wait_frames(1)
	for _i in 100:
		controller.camera.pan(Vector2(1.0, 1.0), 1.0)
	var bounds := controller.camera.bounds
	assert_true(controller.camera.pivot.x <= bounds.end.x + 0.0001, "pivot x within bounds")
	assert_true(controller.camera.pivot.z <= bounds.end.y + 0.0001, "pivot z within bounds")


func test_camera_orbit_keeps_target_centred() -> void:
	var controller := _spawn_range()
	await wait_frames(1)
	controller.camera.rotate_yaw(90.0)
	var cam := controller.camera
	var to_pivot := (cam.pivot - cam.global_position).normalized()
	var look := -cam.global_transform.basis.z
	assert_near(look.dot(to_pivot), 1.0, 0.0001, "camera keeps pivot in view centre after orbit")


func test_camera_pitch_is_clamped() -> void:
	var controller := _spawn_range()
	await wait_frames(1)
	controller.camera.set_pitch(120.0)
	assert_near(controller.camera.pitch_deg, TacticalCamera.MAX_PITCH_DEG, 0.0001, "pitch clamped high")


func test_hud_disconnects_from_event_bus_when_freed() -> void:
	var before := EventBus.simulation_state_changed.get_connections().size()
	var controller := _spawn_range()
	await wait_frames(1)
	assert_true(EventBus.simulation_state_changed.get_connections().size() > before, "HUD connected while alive")
	controller.get_parent().remove_child(controller)
	controller.free()
	_range = null
	assert_eq(EventBus.simulation_state_changed.get_connections().size(), before, "no leaked connections after free")


func test_no_unverified_gamepad_bindings() -> void:
	InputActions.register_defaults()
	for action in InputActions.all_action_names():
		for event in InputMap.action_get_events(action):
			assert_false(event is InputEventJoypadButton or event is InputEventJoypadMotion, "no gamepad binding claimed on %s (gamepad is untested)" % action)
