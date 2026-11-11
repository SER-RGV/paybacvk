extends Node
## Persistent user settings. Owns: camera sensitivity values and their on-disk form.
## Values are clamped on write and on load. Callers decide when to save (save_settings).

const SAVE_PATH := "user://settings.cfg"
const CONFIG_SECTION := "camera"
const VALUE_MIN := 0.25
const VALUE_MAX := 3.0
const DEFAULTS := {
	"camera_pan_speed": 1.0,
	"camera_rotate_speed": 1.0,
	"camera_zoom_speed": 1.0,
}

## preload() avoids the global class cache, which autoloads cannot rely on at startup.
const _INPUT_ACTIONS := preload("res://src/core/input_actions.gd")

var values: Dictionary = {}


func _ready() -> void:
	_INPUT_ACTIONS.register_defaults()
	reset_defaults()
	load_settings()


func reset_defaults() -> void:
	values = DEFAULTS.duplicate()


func has_key(key: String) -> bool:
	return DEFAULTS.has(key)


func get_value(key: String) -> float:
	return float(values.get(key, DEFAULTS.get(key, 1.0)))


func set_value(key: String, value: float) -> bool:
	if not has_key(key):
		push_error("Settings: unknown key '%s'." % key)
		return false
	if is_nan(value) or is_inf(value):
		push_error("Settings: invalid value for '%s'." % key)
		return false
	var clamped := clampf(value, VALUE_MIN, VALUE_MAX)
	values[key] = clamped
	EventBus.settings_changed.emit(key, clamped)
	return true


func load_settings(path: String = SAVE_PATH) -> Error:
	var cfg := ConfigFile.new()
	var err := cfg.load(path)
	if err == ERR_FILE_NOT_FOUND:
		return OK
	if err != OK:
		push_warning("Settings: could not read '%s' (error %d); using defaults." % [path, err])
		return err
	for key in DEFAULTS.keys():
		if cfg.has_section_key(CONFIG_SECTION, key):
			values[key] = clampf(float(cfg.get_value(CONFIG_SECTION, key)), VALUE_MIN, VALUE_MAX)
	return OK


func save_settings(path: String = SAVE_PATH) -> Error:
	var cfg := ConfigFile.new()
	for key in DEFAULTS.keys():
		cfg.set_value(CONFIG_SECTION, key, get_value(key))
	return cfg.save(path)
