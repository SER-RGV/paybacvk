extends Node
## Scene registry and transitions. Owns: the mapping from screen ids to scene paths.
## Unknown ids and missing files fail with an Error and never change the active scene.

const SCENE_PATHS := {
	"main_menu": "res://scenes/main_menu.tscn",
	"settings": "res://scenes/settings_menu.tscn",
	"test_range": "res://scenes/test_range.tscn",
}


func get_screen_ids() -> Array[String]:
	var ids: Array[String] = []
	for key in SCENE_PATHS.keys():
		ids.append(String(key))
	ids.sort()
	return ids


func resolve_path(screen_id: String) -> String:
	return String(SCENE_PATHS.get(screen_id, ""))


func change_scene(screen_id: String) -> Error:
	var path := resolve_path(screen_id)
	if path.is_empty():
		push_error("SceneManager: unknown screen id '%s'." % screen_id)
		return ERR_DOES_NOT_EXIST
	if not ResourceLoader.exists(path):
		push_error("SceneManager: scene file missing for '%s': %s" % [screen_id, path])
		return ERR_FILE_NOT_FOUND
	var err := get_tree().change_scene_to_file(path)
	if err != OK:
		push_error("SceneManager: failed to change to '%s' (error %d)." % [screen_id, err])
		return err
	GameState.set_current_screen(screen_id)
	EventBus.scene_changed.emit(screen_id)
	return OK
