extends CanvasLayer
## Tactical HUD for the test scenario. Owns: its own labels, buttons and transient message.
## Reads simulation state from TestRangeController and EventBus; sends commands only through the
## controller's public methods. It never mutates the clock directly.

const SimulationClock := preload("res://src/tactical/simulation_clock.gd")

const COLOR_TEXT := Color(0.88, 0.90, 0.92)
const COLOR_MUTED := Color(0.60, 0.64, 0.68)
const COLOR_ACCENT := Color(0.85, 0.65, 0.25)
const COLOR_PAUSED := Color(0.93, 0.45, 0.35)
const COLOR_RUNNING := Color(0.55, 0.80, 0.55)
const MESSAGE_SECONDS := 2.5
const HELP_TEXT := "Space pause/resume   [ ] simulation speed   WASD/arrows pan   Q E rotate   Wheel or +/- zoom   Middle-drag orbit   Esc menu"

var _controller: Node
var _time_label: Label
var _state_label: Label
var _speed_label: Label
var _message_label: Label
var _pause_button: Button
var _slower_button: Button
var _faster_button: Button
var _message_time_left := 0.0


func _ready() -> void:
	layer = 10
	_build_layout()


func bind(controller: Node) -> void:
	_controller = controller
	EventBus.simulation_state_changed.connect(_on_simulation_state_changed)
	_on_simulation_state_changed(controller.clock.is_paused(), controller.clock.get_speed())


func _exit_tree() -> void:
	if EventBus.simulation_state_changed.is_connected(_on_simulation_state_changed):
		EventBus.simulation_state_changed.disconnect(_on_simulation_state_changed)


func show_message(text: String) -> void:
	_message_label.text = text
	_message_label.modulate = Color(1, 1, 1, 1)
	_message_time_left = MESSAGE_SECONDS


func get_state_text() -> String:
	return _state_label.text


func get_speed_text() -> String:
	return _speed_label.text


func get_time_text() -> String:
	return _time_label.text


func get_message_text() -> String:
	return _message_label.text


func get_pause_button_text() -> String:
	return _pause_button.text


func _process(delta: float) -> void:
	if _controller != null:
		_time_label.text = "Sim time  %s" % SimulationClock.format_time(_controller.clock.get_sim_time())
	if _message_time_left > 0.0:
		_message_time_left -= delta
		if _message_time_left <= 0.0:
			_message_label.text = ""


func _on_simulation_state_changed(paused: bool, speed: float) -> void:
	if paused:
		_state_label.text = "PAUSED"
		_state_label.add_theme_color_override("font_color", COLOR_PAUSED)
		_pause_button.text = "Resume"
	else:
		_state_label.text = "RUNNING"
		_state_label.add_theme_color_override("font_color", COLOR_RUNNING)
		_pause_button.text = "Pause"
	_speed_label.text = "Speed %.1fx" % speed


func _build_layout() -> void:
	var top_panel := PanelContainer.new()
	top_panel.name = "TopBar"
	top_panel.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top_panel.offset_bottom = 48.0
	add_child(top_panel)
	var top_row := HBoxContainer.new()
	top_row.add_theme_constant_override("separation", 18)
	top_panel.add_child(top_row)

	_state_label = _label("RUNNING", 18, COLOR_RUNNING)
	_state_label.name = "StateLabel"
	top_row.add_child(_state_label)
	_time_label = _label("Sim time  00:00.0", 16, COLOR_TEXT)
	_time_label.name = "TimeLabel"
	top_row.add_child(_time_label)
	_speed_label = _label("Speed 1.0x", 16, COLOR_TEXT)
	_speed_label.name = "SpeedLabel"
	top_row.add_child(_speed_label)

	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_row.add_child(spacer)

	_slower_button = _button("Slower  [", "SlowerButton", "Lower the simulation speed")
	_slower_button.pressed.connect(func(): change_speed_from_hud(-1))
	top_row.add_child(_slower_button)
	_pause_button = _button("Pause", "PauseButton", "Pause or resume the simulation (Space)")
	_pause_button.pressed.connect(func(): toggle_pause_from_hud())
	top_row.add_child(_pause_button)
	_faster_button = _button("Faster  ]", "FasterButton", "Raise the simulation speed")
	_faster_button.pressed.connect(func(): change_speed_from_hud(1))
	top_row.add_child(_faster_button)
	var menu_button := _button("Menu", "MenuButton", "Return to the main menu (Esc)")
	menu_button.pressed.connect(func(): SceneManager.change_scene("main_menu"))
	top_row.add_child(menu_button)

	_message_label = _label("", 16, COLOR_ACCENT)
	_message_label.name = "MessageLabel"
	_message_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP)
	_message_label.offset_top = 64.0
	_message_label.offset_left = -200.0
	_message_label.offset_right = 200.0
	_message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(_message_label)

	var help_panel := PanelContainer.new()
	help_panel.name = "HelpBar"
	help_panel.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	help_panel.offset_top = -36.0
	add_child(help_panel)
	var help := _label(HELP_TEXT, 13, COLOR_MUTED)
	help.name = "HelpLabel"
	help_panel.add_child(help)


func toggle_pause_from_hud() -> void:
	if _controller != null:
		_controller.toggle_pause()


func change_speed_from_hud(direction: int) -> void:
	if _controller != null:
		_controller.change_speed(direction)


func _label(text: String, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	return label


func _button(text: String, node_name: String, tooltip: String) -> Button:
	var button := Button.new()
	button.text = text
	button.name = node_name
	button.tooltip_text = tooltip
	return button
