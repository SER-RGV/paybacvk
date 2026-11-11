extends "res://tests/test_case.gd"
## Integration test for real scene transitions: main menu -> test range -> main menu.
## Uses SceneManager exactly as the buttons and the Esc key do, then waits for the change to land.


func _current_scene_name() -> String:
	var scene := scene_root.get_tree().current_scene
	return scene.name if scene != null else ""


func _leave_to_clean_state() -> void:
	var scene := scene_root.get_tree().current_scene
	if scene != null and is_instance_valid(scene):
		scene.get_parent().remove_child(scene)
		scene.free()
	scene_root.get_tree().current_scene = null


func test_menu_to_test_range_and_back() -> void:
	assert_eq(SceneManager.change_scene("test_range"), OK, "transition to test range accepted")
	var arrived: bool = await wait_for_condition(func() -> bool: return _current_scene_name() == "TestRange")
	assert_true(arrived, "test range became the current scene")
	assert_eq(GameState.current_screen, "test_range", "game state records the new screen")

	assert_eq(SceneManager.change_scene("main_menu"), OK, "transition back to menu accepted")
	var returned: bool = await wait_for_condition(func() -> bool: return _current_scene_name() == "MainMenu")
	assert_true(returned, "main menu became the current scene again")
	assert_eq(GameState.previous_screen, "test_range", "previous screen tracked")
	_leave_to_clean_state()


func test_settings_screen_is_reachable() -> void:
	assert_eq(SceneManager.change_scene("settings"), OK, "transition to settings accepted")
	var arrived: bool = await wait_for_condition(func() -> bool: return _current_scene_name() == "SettingsMenu")
	assert_true(arrived, "settings became the current scene")
	_leave_to_clean_state()
