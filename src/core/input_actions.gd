extends RefCounted
## Single source of truth for abstract input action names and their default bindings.
## Gameplay and UI code reference action names only, never physical keys or buttons.
## Gamepad support (not yet tested): add joypad events to the same action names.
## Bindings use physical keycodes so the layout position stays consistent across keyboard layouts.

const PAUSE_TOGGLE := "tac_pause_toggle"
const SPEED_UP := "tac_speed_up"
const SPEED_DOWN := "tac_speed_down"
const PAN_UP := "cam_pan_up"
const PAN_DOWN := "cam_pan_down"
const PAN_LEFT := "cam_pan_left"
const PAN_RIGHT := "cam_pan_right"
const ROTATE_LEFT := "cam_rotate_left"
const ROTATE_RIGHT := "cam_rotate_right"
const ZOOM_IN := "cam_zoom_in"
const ZOOM_OUT := "cam_zoom_out"


static func all_action_names() -> Array[String]:
	var names: Array[String] = []
	for action in _default_bindings().keys():
		names.append(String(action))
	names.sort()
	return names


## Idempotent: safe to call repeatedly. Adds missing actions and missing events only.
static func register_defaults() -> void:
	var bindings := _default_bindings()
	for action in bindings.keys():
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for event in bindings[action]:
			if not InputMap.action_has_event(action, event):
				InputMap.action_add_event(action, event)


static func _default_bindings() -> Dictionary:
	return {
		PAUSE_TOGGLE: [_key(KEY_SPACE)],
		SPEED_UP: [_key(KEY_BRACKETRIGHT)],
		SPEED_DOWN: [_key(KEY_BRACKETLEFT)],
		PAN_UP: [_key(KEY_W), _key(KEY_UP)],
		PAN_DOWN: [_key(KEY_S), _key(KEY_DOWN)],
		PAN_LEFT: [_key(KEY_A), _key(KEY_LEFT)],
		PAN_RIGHT: [_key(KEY_D), _key(KEY_RIGHT)],
		ROTATE_LEFT: [_key(KEY_Q)],
		ROTATE_RIGHT: [_key(KEY_E)],
		ZOOM_IN: [_mouse(MOUSE_BUTTON_WHEEL_UP), _key(KEY_EQUAL), _key(KEY_KP_ADD)],
		ZOOM_OUT: [_mouse(MOUSE_BUTTON_WHEEL_DOWN), _key(KEY_MINUS), _key(KEY_KP_SUBTRACT)],
	}


static func _key(code: Key) -> InputEventKey:
	var event := InputEventKey.new()
	event.physical_keycode = code
	return event


static func _mouse(button: MouseButton) -> InputEventMouseButton:
	var event := InputEventMouseButton.new()
	event.button_index = button
	return event
