extends Node
## Global signal hub for cross-module notifications.
## Owns no state. Modules publish here; consumers connect and must disconnect in _exit_tree().

signal scene_changed(screen_id: String)
signal settings_changed(key: String, value: float)
signal simulation_state_changed(paused: bool, speed: float)
