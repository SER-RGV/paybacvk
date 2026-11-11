extends "res://tests/test_case.gd"
## Unit tests for EventBus signals and GameState bookkeeping.


func test_event_bus_declares_expected_signals() -> void:
	assert_true(EventBus.has_signal("scene_changed"), "scene_changed declared")
	assert_true(EventBus.has_signal("settings_changed"), "settings_changed declared")
	assert_true(EventBus.has_signal("simulation_state_changed"), "simulation_state_changed declared")


func test_simulation_state_is_delivered_to_listeners() -> void:
	var received: Array = []
	var listener := func(paused: bool, speed: float) -> void: received.append([paused, speed])
	EventBus.simulation_state_changed.connect(listener)
	EventBus.simulation_state_changed.emit(true, 2.0)
	EventBus.simulation_state_changed.disconnect(listener)
	assert_eq(received, [[true, 2.0]], "payload delivered once")


func test_game_state_tracks_previous_screen() -> void:
	var state := GameState
	state.set_current_screen("main_menu")
	state.set_current_screen("test_range")
	assert_eq(state.current_screen, "test_range", "current screen updated")
	assert_eq(state.previous_screen, "main_menu", "previous screen kept")
	state.reset()
	assert_eq(state.current_screen, "", "reset clears current screen")
