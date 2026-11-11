extends "res://tests/test_case.gd"
## Unit tests for SimulationClock: fixed steps, pause, speed levels, caps and determinism.

const SimulationClock := preload("res://src/tactical/simulation_clock.gd")


func test_starts_running_at_normal_speed() -> void:
	var clock := SimulationClock.new()
	assert_false(clock.is_paused(), "clock starts running")
	assert_near(clock.get_speed(), 1.0, 0.0001, "default speed is 1x")
	assert_near(clock.get_sim_time(), 0.0, 0.0001, "sim time starts at zero")


func test_advance_runs_whole_fixed_steps_only() -> void:
	var clock := SimulationClock.new()
	var steps := clock.advance(0.25)
	assert_eq(steps, 2, "0.25s at 1x is two 0.1s steps")
	assert_near(clock.get_sim_time(), 0.2, 0.0001, "sim time after 0.25s")


func test_remainder_carries_between_frames() -> void:
	var clock := SimulationClock.new()
	assert_eq(clock.advance(0.05), 0, "half a step produces nothing")
	assert_eq(clock.advance(0.05), 1, "remainder completes one step")
	assert_eq(clock.step_count, 1, "exactly one step recorded")


func test_pause_stops_simulation() -> void:
	var clock := SimulationClock.new()
	clock.pause()
	assert_eq(clock.advance(10.0), 0, "paused clock runs no steps")
	assert_near(clock.get_sim_time(), 0.0, 0.0001, "sim time frozen while paused")


func test_resume_continues_from_frozen_time() -> void:
	var clock := SimulationClock.new()
	clock.advance(1.0)
	clock.pause()
	clock.advance(5.0)
	clock.resume()
	clock.advance(0.5)
	assert_near(clock.get_sim_time(), 1.5, 0.0001, "time resumes where it stopped")


func test_toggle_pause_flips_state() -> void:
	var clock := SimulationClock.new()
	clock.toggle_pause()
	assert_true(clock.is_paused(), "first toggle pauses")
	clock.toggle_pause()
	assert_false(clock.is_paused(), "second toggle resumes")


func test_speed_scales_steps() -> void:
	var clock := SimulationClock.new()
	assert_true(clock.set_speed(2.0), "2x is a valid level")
	assert_eq(clock.advance(1.0), 20, "one real second at 2x is twenty steps")
	assert_near(clock.get_sim_time(), 2.0, 0.0001, "two simulated seconds")


func test_half_speed_halves_steps() -> void:
	var clock := SimulationClock.new()
	clock.set_speed(0.5)
	assert_eq(clock.advance(1.0), 5, "one real second at 0.5x is five steps")


func test_speed_stepping_respects_limits() -> void:
	var clock := SimulationClock.new()
	assert_true(clock.step_speed(1), "can go faster from 1x")
	assert_near(clock.get_speed(), 2.0, 0.0001, "now 2x")
	assert_true(clock.step_speed(1), "can go to max")
	assert_false(clock.step_speed(1), "max speed cannot be exceeded")
	assert_near(clock.get_speed(), 4.0, 0.0001, "still at max 4x")
	clock.set_speed_index(0)
	assert_false(clock.step_speed(-1), "min speed cannot be lowered")
	assert_false(clock.step_speed(0), "zero direction is rejected")


func test_invalid_speed_is_rejected_without_change() -> void:
	var clock := SimulationClock.new()
	assert_false(clock.set_speed(3.7), "non-level speed rejected")
	assert_false(clock.set_speed_index(99), "out-of-range index rejected")
	assert_near(clock.get_speed(), 1.0, 0.0001, "speed unchanged after rejection")


func test_negative_and_nan_deltas_are_ignored() -> void:
	var clock := SimulationClock.new()
	assert_eq(clock.advance(-1.0), 0, "negative delta ignored")
	assert_eq(clock.advance(NAN), 0, "NaN delta ignored")
	assert_eq(clock.advance(0.0), 0, "zero delta ignored")
	assert_eq(clock.step_count, 0, "no steps recorded")


func test_step_signal_emits_sequential_indices() -> void:
	var clock := SimulationClock.new()
	var seen: Array = []
	clock.step_advanced.connect(func(index: int, _dt: float) -> void: seen.append(index))
	clock.advance(0.5)
	assert_eq(seen, [1, 2, 3, 4, 5], "five sequential step indices")


func test_state_signal_fires_on_pause_and_speed_change() -> void:
	var clock := SimulationClock.new()
	var events: Array = []
	clock.state_changed.connect(func(paused: bool, speed: float) -> void: events.append([paused, speed]))
	clock.pause()
	clock.pause()
	clock.set_speed_index(2)
	assert_eq(events.size(), 2, "redundant pause does not emit")
	assert_eq(events[0], [true, 1.0], "pause event payload")
	assert_eq(events[1], [true, 2.0], "speed event payload keeps paused state")


func test_catch_up_is_capped_and_backlog_dropped() -> void:
	var clock := SimulationClock.new()
	clock.set_speed(4.0)
	var steps := clock.advance(100.0)
	assert_eq(steps, SimulationClock.MAX_STEPS_PER_ADVANCE, "one call never exceeds the cap")
	assert_eq(clock.advance(0.0), 0, "zero delta after a capped call produces nothing")
	assert_eq(clock.advance(0.1), 4, "normal frames resume at 4x after the cap")


func test_identical_inputs_replay_identically() -> void:
	var deltas := [0.016, 0.033, 0.5, 0.007, 0.25, 0.1, 0.12]
	var first := SimulationClock.new()
	var second := SimulationClock.new()
	for clock in [first, second]:
		clock.set_speed(2.0)
	for i in deltas.size():
		if i == 3:
			first.pause()
			second.pause()
		if i == 5:
			first.resume()
			second.resume()
		first.advance(deltas[i])
		second.advance(deltas[i])
	assert_eq(first.step_count, second.step_count, "same step count")
	assert_near(first.get_sim_time(), second.get_sim_time(), 0.000001, "same simulated time")


func test_format_time_outputs_minutes_seconds_tenths() -> void:
	assert_eq(SimulationClock.format_time(0.0), "00:00.0", "zero")
	assert_eq(SimulationClock.format_time(65.25), "01:05.2", "floors to tenths")
	assert_eq(SimulationClock.format_time(-4.0), "00:00.0", "negative clamps to zero")
	assert_eq(SimulationClock.format_time(600.0), "10:00.0", "ten minutes")
