extends RefCounted
## Fixed-step tactical simulation clock with pause and discrete speed levels.
## Owns: simulation time, step counter, pause flag, speed level and the sub-step accumulator.
## It never reads the real clock: callers pass real delta seconds into advance().
## It has no autoload or scene dependencies, so it can be unit-tested and replayed deterministically.

signal step_advanced(step_index: int, step_seconds: float)
signal state_changed(paused: bool, speed: float)

const STEP_SECONDS := 0.1
const SPEED_LEVELS := [0.5, 1.0, 2.0, 4.0]
const DEFAULT_SPEED_INDEX := 1
## Upper bound on steps executed by one advance() call. Excess backlog is dropped
## so a long frame cannot trigger a spiral of catch-up work.
const MAX_STEPS_PER_ADVANCE := 40
const _EPSILON := 1e-9

var step_count: int = 0

var _paused := false
var _speed_index := DEFAULT_SPEED_INDEX
var _accumulator := 0.0


func is_paused() -> bool:
	return _paused


func get_speed() -> float:
	return float(SPEED_LEVELS[_speed_index])


func get_speed_index() -> int:
	return _speed_index


func get_sim_time() -> float:
	return step_count * STEP_SECONDS


func pause() -> void:
	if not _paused:
		_paused = true
		state_changed.emit(_paused, get_speed())


func resume() -> void:
	if _paused:
		_paused = false
		state_changed.emit(_paused, get_speed())


func toggle_pause() -> void:
	if _paused:
		resume()
	else:
		pause()


## Returns false (and changes nothing) for an out-of-range index.
func set_speed_index(index: int) -> bool:
	if index < 0 or index >= SPEED_LEVELS.size():
		return false
	if index != _speed_index:
		_speed_index = index
		state_changed.emit(_paused, get_speed())
	return true


## Moves one speed level up (direction > 0) or down (direction < 0).
## Returns false when already at the limit or when direction is 0.
func step_speed(direction: int) -> bool:
	if direction == 0:
		return false
	var target := _speed_index + signi(direction)
	if target < 0 or target >= SPEED_LEVELS.size():
		return false
	return set_speed_index(target)


## Accepts only the discrete speed levels. Returns false for any other value.
func set_speed(value: float) -> bool:
	for index in SPEED_LEVELS.size():
		if is_equal_approx(float(SPEED_LEVELS[index]), value):
			return set_speed_index(index)
	return false


## Advances simulated time by real_delta * speed and runs whole fixed steps.
## Returns the number of steps executed. Paused, zero, negative or NaN deltas do nothing.
func advance(real_delta: float) -> int:
	if _paused or not (real_delta > 0.0) or is_inf(real_delta):
		return 0
	_accumulator += real_delta * get_speed()
	var due := int(floor(_accumulator / STEP_SECONDS + _EPSILON))
	if due > MAX_STEPS_PER_ADVANCE:
		due = MAX_STEPS_PER_ADVANCE
		_accumulator = 0.0
	else:
		_accumulator -= due * STEP_SECONDS
		if _accumulator < 0.0:
			_accumulator = 0.0
	for _i in due:
		step_count += 1
		step_advanced.emit(step_count, STEP_SECONDS)
	return due


## Formats simulated seconds as MM:SS.t (tenths of a second, floored).
static func format_time(seconds: float) -> String:
	var tenths := int(floor(maxf(seconds, 0.0) * 10.0 + 1e-6))
	var minutes := floori(float(tenths) / 600.0)
	var secs := floori(float(tenths) / 10.0) % 60
	return "%02d:%02d.%d" % [minutes, secs, tenths % 10]
