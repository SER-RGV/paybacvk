extends Node3D
## Isometric orthographic camera rig. Owns: pivot point, yaw, pitch, zoom and pan bounds.
## Input is read here, but every state change goes through a public method so tests can drive it.

signal view_changed

const CameraMath := preload("res://src/camera/camera_math.gd")
const InputActions := preload("res://src/core/input_actions.gd")
const DEFAULT_ZOOM := 22.0
const MIN_ZOOM := 8.0
const MAX_ZOOM := 40.0
const DEFAULT_PITCH_DEG := 35.264
const MIN_PITCH_DEG := 20.0
const MAX_PITCH_DEG := 70.0
const DEFAULT_YAW_DEG := 45.0
const CAMERA_DISTANCE := 100.0
const BASE_PAN_SPEED := 12.0
const BASE_ROTATE_SPEED_DEG := 90.0
const ZOOM_STEP_RATIO := 0.12
const DRAG_YAW_DEG_PER_PIXEL := 0.3
const DRAG_PITCH_DEG_PER_PIXEL := 0.2

var pivot := Vector3.ZERO
var yaw_deg := DEFAULT_YAW_DEG
var pitch_deg := DEFAULT_PITCH_DEG
var zoom := DEFAULT_ZOOM
var bounds := Rect2(-40.0, -40.0, 80.0, 80.0)
var input_enabled := true
var camera: Camera3D

var _dragging := false


func _ready() -> void:
	camera = Camera3D.new()
	camera.name = "Camera"
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.near = 1.0
	camera.far = 400.0
	add_child(camera)
	camera.make_current()
	_apply()


func _process(delta: float) -> void:
	if not input_enabled:
		return
	var pan_input := Input.get_vector(InputActions.PAN_LEFT, InputActions.PAN_RIGHT, InputActions.PAN_UP, InputActions.PAN_DOWN)
	if pan_input != Vector2.ZERO:
		pan(pan_input, delta)
	var rotate_axis := Input.get_axis(InputActions.ROTATE_LEFT, InputActions.ROTATE_RIGHT)
	if not is_zero_approx(rotate_axis):
		rotate_yaw(rotate_axis * BASE_ROTATE_SPEED_DEG * _setting("camera_rotate_speed") * delta)


func _unhandled_input(event: InputEvent) -> void:
	if not input_enabled:
		return
	if event.is_action_pressed(InputActions.ZOOM_IN):
		zoom_by(-1)
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed(InputActions.ZOOM_OUT):
		zoom_by(1)
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_MIDDLE:
		_dragging = event.pressed
	elif event is InputEventMouseMotion and _dragging:
		rotate_yaw(-event.relative.x * DRAG_YAW_DEG_PER_PIXEL)
		set_pitch(pitch_deg + event.relative.y * DRAG_PITCH_DEG_PER_PIXEL)


## input: x right(+), y down(+). Pan speed scales with zoom so the feel stays consistent.
func pan(input: Vector2, delta: float) -> void:
	var speed := BASE_PAN_SPEED * (zoom / DEFAULT_ZOOM) * _setting("camera_pan_speed") * delta
	pivot = CameraMath.clamp_to_bounds(pivot + CameraMath.pan_delta(input, yaw_deg, speed), bounds)
	_apply()


func rotate_yaw(delta_deg: float) -> void:
	yaw_deg = CameraMath.wrap_yaw(yaw_deg + delta_deg)
	_apply()


func set_pitch(value_deg: float) -> void:
	pitch_deg = CameraMath.clamp_pitch(value_deg, MIN_PITCH_DEG, MAX_PITCH_DEG)
	_apply()


## direction > 0 zooms out, < 0 zooms in.
func zoom_by(direction: int) -> void:
	if direction == 0:
		return
	var ratio := ZOOM_STEP_RATIO * _setting("camera_zoom_speed")
	zoom = CameraMath.clamp_zoom(CameraMath.apply_zoom_step(zoom, direction, ratio), MIN_ZOOM, MAX_ZOOM)
	_apply()


func focus_on(point: Vector3) -> void:
	pivot = CameraMath.clamp_to_bounds(Vector3(point.x, 0.0, point.z), bounds)
	_apply()


func reset_view() -> void:
	pivot = Vector3.ZERO
	yaw_deg = DEFAULT_YAW_DEG
	pitch_deg = DEFAULT_PITCH_DEG
	zoom = DEFAULT_ZOOM
	_apply()


func _apply() -> void:
	var offset := CameraMath.orbit_offset(yaw_deg, pitch_deg, CAMERA_DISTANCE)
	transform = Transform3D(Basis.looking_at(-offset, Vector3.UP), pivot + offset)
	if camera != null:
		camera.size = zoom
	view_changed.emit()


func _setting(key: String) -> float:
	return Settings.get_value(key)
