extends Node
## Application-level state. Owns: which screen is active and which screen came before it.
## Written only by SceneManager. Tactical simulation state is owned by SimulationClock, not here.

var current_screen: String = ""
var previous_screen: String = ""


func set_current_screen(screen_id: String) -> void:
	previous_screen = current_screen
	current_screen = screen_id


func reset() -> void:
	current_screen = ""
	previous_screen = ""
