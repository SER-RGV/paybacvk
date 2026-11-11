extends SceneTree
## Headless test runner. Discovers test_*.gd files in tests/unit and tests/integration,
## runs every method named test_*, prints a report and exits 0 (all pass) or 1 (any failure).
## Usage: godot --headless --path . -s res://tests/run_tests.gd -- [--filter=substring]

const SUITE_DIRS := ["res://tests/unit", "res://tests/integration"]

const TestCase := preload("res://tests/test_case.gd")

var _passed := 0
var _failed := 0
var _assertions := 0
var _report_lines: Array[String] = []


func _initialize() -> void:
	# Deferred so the root window is fully inside the scene tree before any test spawns nodes.
	_run_all.call_deferred()


func _run_all() -> void:
	var filter := _read_filter()
	var suites := _discover_suites()
	if suites.is_empty():
		push_error("No test suites found.")
		quit(1)
		return
	for suite_path in suites:
		var script := load(suite_path) as GDScript
		if script == null:
			_record_failure(suite_path, "could not load script")
			continue
		for method in _test_methods(script):
			var test_name := "%s::%s" % [suite_path.get_file(), method]
			if not filter.is_empty() and not test_name.contains(filter):
				continue
			await _run_one(script, method, test_name)
	_print_summary()
	quit(1 if _failed > 0 else 0)


func _run_one(script: GDScript, method: String, test_name: String) -> void:
	var test: TestCase = script.new()
	test.scene_root = root
	test.setup()
	await test.call(method)
	test.teardown()
	var failures := test.get_failures()
	_assertions += test.get_assertion_count()
	if test.get_assertion_count() == 0:
		failures.append("test made no assertions (a test that checks nothing cannot pass)")
	if failures.is_empty():
		_passed += 1
		_log("PASS  %s (%d assertions)" % [test_name, test.get_assertion_count()])
	else:
		_failed += 1
		_log("FAIL  %s" % test_name)
		for failure in failures:
			_log("        - %s" % failure)


func _log(line: String) -> void:
	_report_lines.append(line)
	print(line)


func _record_failure(test_name: String, message: String) -> void:
	_failed += 1
	_log("FAIL  %s: %s" % [test_name, message])


func _print_summary() -> void:
	print("")
	print("==== Test summary ====")
	print("Passed: %d   Failed: %d   Assertions: %d" % [_passed, _failed, _assertions])
	print("RESULT: %s" % ("PASS" if _failed == 0 else "FAIL"))


func _discover_suites() -> Array[String]:
	var found: Array[String] = []
	for dir_path in SUITE_DIRS:
		var dir := DirAccess.open(dir_path)
		if dir == null:
			continue
		for file_name in dir.get_files():
			if file_name.begins_with("test_") and file_name.ends_with(".gd"):
				found.append("%s/%s" % [dir_path, file_name])
	found.sort()
	return found


func _test_methods(script: GDScript) -> Array[String]:
	var names: Array[String] = []
	for method in script.get_script_method_list():
		var method_name: String = method["name"]
		if method_name.begins_with("test_"):
			names.append(method_name)
	names.sort()
	return names


func _read_filter() -> String:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--filter="):
			return arg.trim_prefix("--filter=")
	return ""
