extends Control
## Settings screen. Owns: its widgets only. Values live in the Settings autoload.
## Slider changes apply immediately; the file is written when the player leaves the screen.

const ROWS := [
	{"key": "camera_pan_speed", "label": "Camera pan speed"},
	{"key": "camera_rotate_speed", "label": "Camera rotate speed"},
	{"key": "camera_zoom_speed", "label": "Camera zoom speed"},
]
const COLOR_BACKGROUND := Color(0.07, 0.08, 0.09)
const COLOR_ACCENT := Color(0.85, 0.65, 0.25)

var _value_labels: Dictionary = {}


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var background := ColorRect.new()
	background.name = "Background"
	background.color = COLOR_BACKGROUND
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	var column := VBoxContainer.new()
	column.name = "Column"
	column.custom_minimum_size = Vector2(520, 0)
	column.add_theme_constant_override("separation", 14)
	center.add_child(column)

	var title := Label.new()
	title.name = "Title"
	title.text = "Settings"
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", COLOR_ACCENT)
	column.add_child(title)

	for row in ROWS:
		column.add_child(_make_slider_row(row["key"], row["label"]))

	var buttons := HBoxContainer.new()
	buttons.add_theme_constant_override("separation", 12)
	column.add_child(buttons)
	var reset_button := Button.new()
	reset_button.name = "ResetButton"
	reset_button.text = "Reset to defaults"
	reset_button.pressed.connect(_on_reset)
	buttons.add_child(reset_button)
	var back_button := Button.new()
	back_button.name = "BackButton"
	back_button.text = "Back"
	back_button.pressed.connect(_on_back)
	buttons.add_child(back_button)

	_refresh_all()


func get_value_text(key: String) -> String:
	if not _value_labels.has(key):
		return ""
	return (_value_labels[key] as Label).text


func set_slider_value(key: String, value: float) -> void:
	var slider := find_child("Slider_" + key, true, false) as HSlider
	if slider != null:
		slider.value = value


func _make_slider_row(key: String, label_text: String) -> Control:
	var row := HBoxContainer.new()
	row.name = "Row_" + key
	row.add_theme_constant_override("separation", 12)
	var label := Label.new()
	label.text = label_text
	label.custom_minimum_size = Vector2(200, 0)
	row.add_child(label)
	var slider := HSlider.new()
	slider.name = "Slider_" + key
	slider.min_value = Settings.VALUE_MIN
	slider.max_value = Settings.VALUE_MAX
	slider.step = 0.05
	slider.custom_minimum_size = Vector2(220, 0)
	slider.value = Settings.get_value(key)
	slider.value_changed.connect(_on_slider_changed.bind(key))
	row.add_child(slider)
	var value_label := Label.new()
	value_label.name = "Value_" + key
	value_label.custom_minimum_size = Vector2(60, 0)
	row.add_child(value_label)
	_value_labels[key] = value_label
	return row


func _on_slider_changed(value: float, key: String) -> void:
	Settings.set_value(key, value)
	_refresh_all()


func _on_reset() -> void:
	Settings.reset_defaults()
	for row in ROWS:
		set_slider_value(row["key"], Settings.get_value(row["key"]))
	_refresh_all()


func _on_back() -> void:
	Settings.save_settings()
	SceneManager.change_scene("main_menu")


func _refresh_all() -> void:
	for key in _value_labels.keys():
		(_value_labels[key] as Label).text = "%.2fx" % Settings.get_value(key)
