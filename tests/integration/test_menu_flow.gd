extends "res://tests/test_case.gd"
## Integration tests for the main menu and settings screens.
## Only non-navigating controls are pressed here, so the active scene is never replaced.

var _nodes: Array[Node] = []


func setup() -> void:
	Settings.reset_defaults()


func teardown() -> void:
	for node in _nodes:
		if is_instance_valid(node):
			if node.get_parent() != null:
				node.get_parent().remove_child(node)
			node.free()
	_nodes.clear()
	Settings.reset_defaults()


func _spawn(path: String) -> Node:
	var node := (load(path) as PackedScene).instantiate()
	scene_root.add_child(node)
	_nodes.append(node)
	return node


func test_main_menu_buttons_are_all_wired() -> void:
	var menu := _spawn("res://scenes/main_menu.tscn")
	await wait_frames(1)
	for node_name in ["EnterTestRangeButton", "SettingsButton", "QuitButton"]:
		var button := menu.find_child(node_name, true, false) as Button
		assert_true(button != null, "button exists: %s" % node_name)
		if button != null:
			assert_false(button.text.is_empty(), "button has a label: %s" % node_name)
			assert_true(button.pressed.get_connections().size() > 0, "button is wired: %s" % node_name)


func test_main_menu_has_no_unimplemented_entries() -> void:
	var menu := _spawn("res://scenes/main_menu.tscn")
	await wait_frames(1)
	var buttons := _collect_buttons(menu)
	assert_eq(buttons.size(), 3, "exactly the three functional entries are shown")


func test_settings_slider_updates_setting_and_label() -> void:
	var screen := _spawn("res://scenes/settings_menu.tscn")
	await wait_frames(1)
	screen.set_slider_value("camera_zoom_speed", 2.5)
	assert_near(Settings.get_value("camera_zoom_speed"), 2.5, 0.0001, "slider writes Settings")
	assert_eq(screen.get_value_text("camera_zoom_speed"), "2.50x", "label reflects value")


func test_settings_reset_restores_defaults() -> void:
	var screen := _spawn("res://scenes/settings_menu.tscn")
	await wait_frames(1)
	screen.set_slider_value("camera_pan_speed", 0.5)
	(screen.find_child("ResetButton", true, false) as Button).pressed.emit()
	assert_near(Settings.get_value("camera_pan_speed"), 1.0, 0.0001, "reset restores default")
	assert_eq(screen.get_value_text("camera_pan_speed"), "1.00x", "label restored")


func _collect_buttons(node: Node) -> Array[Button]:
	var found: Array[Button] = []
	for child in node.find_children("*", "Button", true, false):
		found.append(child as Button)
	return found
