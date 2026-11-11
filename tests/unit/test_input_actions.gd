extends "res://tests/test_case.gd"
## Unit tests for the abstract input action map.

const InputActions := preload("res://src/core/input_actions.gd")


func test_register_defaults_is_idempotent() -> void:
	InputActions.register_defaults()
	var first_count := InputMap.action_get_events(InputActions.PAUSE_TOGGLE).size()
	InputActions.register_defaults()
	InputActions.register_defaults()
	assert_eq(InputMap.action_get_events(InputActions.PAUSE_TOGGLE).size(), first_count, "no duplicate events")


func test_every_declared_action_exists_with_a_binding() -> void:
	InputActions.register_defaults()
	for action in InputActions.all_action_names():
		assert_true(InputMap.has_action(action), "action registered: %s" % action)
		assert_true(InputMap.action_get_events(action).size() > 0, "action has a binding: %s" % action)


func test_pause_is_bound_to_space() -> void:
	InputActions.register_defaults()
	var space := InputEventKey.new()
	space.physical_keycode = KEY_SPACE
	assert_true(InputMap.event_is_action(space, InputActions.PAUSE_TOGGLE), "space toggles pause")


func test_zoom_wheel_is_bound() -> void:
	InputActions.register_defaults()
	var wheel := InputEventMouseButton.new()
	wheel.button_index = MOUSE_BUTTON_WHEEL_UP
	wheel.pressed = true
	assert_true(InputMap.event_is_action(wheel, InputActions.ZOOM_IN), "wheel up zooms in")


func test_action_names_are_unique_and_sorted() -> void:
	var names := InputActions.all_action_names()
	var unique := {}
	for name in names:
		unique[name] = true
	assert_eq(unique.size(), names.size(), "no duplicate action names")
	assert_eq(names, names.duplicate(), "names returned sorted")
	var sorted := names.duplicate()
	sorted.sort()
	assert_eq(names, sorted, "names sorted alphabetically")
