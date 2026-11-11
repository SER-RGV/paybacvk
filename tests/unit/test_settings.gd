extends "res://tests/test_case.gd"
## Unit tests for the Settings autoload. Uses a temporary file and restores defaults afterwards.

const TEMP_PATH := "user://test_settings_tmp.cfg"


func setup() -> void:
	Settings.reset_defaults()


func teardown() -> void:
	Settings.reset_defaults()
	if FileAccess.file_exists(TEMP_PATH):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(TEMP_PATH))


func test_defaults_are_neutral() -> void:
	for key in Settings.DEFAULTS.keys():
		assert_near(Settings.get_value(key), 1.0, 0.0001, "default for %s is 1.0" % key)


func test_values_are_clamped_on_write() -> void:
	assert_true(Settings.set_value("camera_pan_speed", 10.0), "accepted key")
	assert_near(Settings.get_value("camera_pan_speed"), Settings.VALUE_MAX, 0.0001, "clamped to max")
	Settings.set_value("camera_pan_speed", 0.0)
	assert_near(Settings.get_value("camera_pan_speed"), Settings.VALUE_MIN, 0.0001, "clamped to min")


func test_unknown_key_is_rejected() -> void:
	assert_false(Settings.set_value("not_a_setting", 1.0), "unknown key rejected")
	assert_false(Settings.has_key("not_a_setting"), "unknown key not registered")


func test_nan_is_rejected() -> void:
	Settings.set_value("camera_zoom_speed", 2.0)
	assert_false(Settings.set_value("camera_zoom_speed", NAN), "NaN rejected")
	assert_near(Settings.get_value("camera_zoom_speed"), 2.0, 0.0001, "previous value kept")


func test_save_and_load_round_trip() -> void:
	Settings.set_value("camera_rotate_speed", 2.25)
	assert_eq(Settings.save_settings(TEMP_PATH), OK, "save succeeds")
	Settings.reset_defaults()
	assert_eq(Settings.load_settings(TEMP_PATH), OK, "load succeeds")
	assert_near(Settings.get_value("camera_rotate_speed"), 2.25, 0.0001, "value restored from disk")


func test_missing_file_loads_defaults_without_error() -> void:
	Settings.set_value("camera_pan_speed", 2.0)
	assert_eq(Settings.load_settings("user://does_not_exist_settings.cfg"), OK, "missing file is not an error")
	assert_near(Settings.get_value("camera_pan_speed"), 2.0, 0.0001, "missing file leaves current values")


func test_out_of_range_file_values_are_clamped_on_load() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("camera", "camera_zoom_speed", 99.0)
	cfg.save(TEMP_PATH)
	Settings.load_settings(TEMP_PATH)
	assert_near(Settings.get_value("camera_zoom_speed"), Settings.VALUE_MAX, 0.0001, "file value clamped on load")
