extends RefCounted
## Base class for project tests. Each test_* method runs in isolation with setup()/teardown().
## Assertions record failures instead of aborting, so one run reports every failing check.

var scene_root: Node
var _failures: Array[String] = []
var _assertion_count := 0


func setup() -> void:
	pass


func teardown() -> void:
	pass


func assert_true(condition: bool, message: String = "") -> void:
	_assertion_count += 1
	if not condition:
		_failures.append("assert_true failed: %s" % message)


func assert_false(condition: bool, message: String = "") -> void:
	assert_true(not condition, message)


func assert_eq(actual: Variant, expected: Variant, message: String = "") -> void:
	_assertion_count += 1
	if actual != expected:
		_failures.append("assert_eq failed: %s (expected %s, got %s)" % [message, str(expected), str(actual)])


func assert_near(actual: float, expected: float, tolerance: float = 0.0001, message: String = "") -> void:
	_assertion_count += 1
	if absf(actual - expected) > tolerance:
		_failures.append("assert_near failed: %s (expected %f +/- %f, got %f)" % [message, expected, tolerance, actual])


## Waits for process frames on the scene tree. Use with: await wait_frames(n)
func wait_frames(count: int) -> void:
	for _i in count:
		await scene_root.get_tree().process_frame


## Waits until the scene tree has advanced simulated time, up to max_frames frames.
## Headless frame deltas vary, so tests wait on the condition instead of a fixed frame count.
func wait_for_condition(condition: Callable, max_frames: int = 600) -> bool:
	for _i in max_frames:
		if condition.call():
			return true
		await scene_root.get_tree().process_frame
	return condition.call()


func get_failures() -> Array[String]:
	return _failures


func get_assertion_count() -> int:
	return _assertion_count


func clear_failures() -> void:
	_failures.clear()
