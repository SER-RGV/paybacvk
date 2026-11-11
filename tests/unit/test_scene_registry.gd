extends "res://tests/test_case.gd"
## Unit tests for the SceneManager registry. Never changes the active scene.


func test_known_screens_resolve_to_existing_files() -> void:
	for screen_id in SceneManager.get_screen_ids():
		var path := SceneManager.resolve_path(screen_id)
		assert_false(path.is_empty(), "path resolved for %s" % screen_id)
		assert_true(ResourceLoader.exists(path), "scene file exists: %s" % path)


func test_unknown_screen_resolves_to_empty() -> void:
	assert_eq(SceneManager.resolve_path("campaign_hq"), "", "unregistered id has no path")


func test_unknown_screen_change_returns_error_without_switching() -> void:
	var before := GameState.current_screen
	var err := SceneManager.change_scene("does_not_exist")
	assert_eq(err, ERR_DOES_NOT_EXIST, "unknown id returns ERR_DOES_NOT_EXIST")
	assert_eq(GameState.current_screen, before, "game state unchanged on failure")


func test_every_registered_scene_loads_and_instantiates() -> void:
	for screen_id in SceneManager.get_screen_ids():
		var packed := load(SceneManager.resolve_path(screen_id)) as PackedScene
		assert_true(packed != null, "scene loads: %s" % screen_id)
		if packed != null:
			var node := packed.instantiate()
			assert_true(node != null, "scene instantiates: %s" % screen_id)
			if node != null:
				node.free()
