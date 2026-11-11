extends Control
## Main menu. Owns: its buttons only. Every button maps to a working destination; no placeholders.

const COLOR_BACKGROUND := Color(0.07, 0.08, 0.09)
const COLOR_ACCENT := Color(0.85, 0.65, 0.25)
const COLOR_MUTED := Color(0.60, 0.64, 0.68)


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var background := ColorRect.new()
	background.name = "Background"
	background.color = COLOR_BACKGROUND
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var center := CenterContainer.new()
	center.name = "Center"
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	var column := VBoxContainer.new()
	column.name = "Column"
	column.add_theme_constant_override("separation", 12)
	center.add_child(column)

	var title := Label.new()
	title.name = "Title"
	title.text = "UMBRAL DE ACERO"
	title.add_theme_font_size_override("font_size", 44)
	title.add_theme_color_override("font_color", COLOR_ACCENT)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(title)

	var subtitle := Label.new()
	subtitle.name = "Subtitle"
	subtitle.text = "Milestone 01 — Tactical foundation"
	subtitle.add_theme_font_size_override("font_size", 16)
	subtitle.add_theme_color_override("font_color", COLOR_MUTED)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(subtitle)

	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 24)
	column.add_child(spacer)

	column.add_child(_make_button("Enter Test Range", "EnterTestRangeButton", _on_enter_test_range))
	column.add_child(_make_button("Settings", "SettingsButton", _on_settings))
	column.add_child(_make_button("Quit", "QuitButton", _on_quit))


func _make_button(text: String, node_name: String, handler: Callable) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.custom_minimum_size = Vector2(320, 44)
	button.pressed.connect(handler)
	return button


func _on_enter_test_range() -> void:
	SceneManager.change_scene("test_range")


func _on_settings() -> void:
	SceneManager.change_scene("settings")


func _on_quit() -> void:
	get_tree().quit()
