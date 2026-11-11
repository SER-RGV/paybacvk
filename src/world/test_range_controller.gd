extends Node3D
## Phase 01 test scenario. Owns: the SimulationClock, the camera rig, the HUD and the test probe.
## Simulation state is changed only through this controller's public methods, which then publish
## EventBus.simulation_state_changed so the HUD and other listeners stay in sync.

const SimulationClock := preload("res://src/tactical/simulation_clock.gd")
const TacticalCamera := preload("res://src/camera/tactical_camera.gd")
const TacticalHud := preload("res://src/ui/tactical_hud.gd")
const InputActions := preload("res://src/core/input_actions.gd")

const PROBE_SPIN_RAD_PER_SIM_SECOND := 0.5
const SPEED_LIMIT_MESSAGE := "Speed limit reached"

var clock: SimulationClock
var camera: TacticalCamera
var hud: TacticalHud
var probe: Node3D


func _ready() -> void:
	clock = SimulationClock.new()
	clock.step_advanced.connect(_on_sim_step)
	clock.state_changed.connect(_on_clock_state_changed)
	_build_environment()
	camera = TacticalCamera.new()
	camera.name = "TacticalCamera"
	camera.bounds = Rect2(-40.0, -40.0, 80.0, 80.0)
	add_child(camera)
	hud = TacticalHud.new()
	hud.name = "TacticalHud"
	add_child(hud)
	hud.bind(self)
	EventBus.simulation_state_changed.emit(clock.is_paused(), clock.get_speed())


func _process(delta: float) -> void:
	clock.advance(delta)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed(InputActions.PAUSE_TOGGLE):
		toggle_pause()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed(InputActions.SPEED_UP):
		change_speed(1)
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed(InputActions.SPEED_DOWN):
		change_speed(-1)
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("ui_cancel"):
		SceneManager.change_scene("main_menu")
		get_viewport().set_input_as_handled()


func toggle_pause() -> void:
	clock.toggle_pause()


func pause() -> void:
	clock.pause()


func resume() -> void:
	clock.resume()


## Returns false and tells the HUD when the speed limit is already reached.
func change_speed(direction: int) -> bool:
	var changed := clock.step_speed(direction)
	if not changed and hud != null:
		hud.show_message(SPEED_LIMIT_MESSAGE)
	return changed


func _on_clock_state_changed(paused: bool, speed: float) -> void:
	EventBus.simulation_state_changed.emit(paused, speed)


func _on_sim_step(_step_index: int, _step_seconds: float) -> void:
	if probe != null:
		probe.rotation.y = clock.get_sim_time() * PROBE_SPIN_RAD_PER_SIM_SECOND


func _build_environment() -> void:
	var world_env := WorldEnvironment.new()
	world_env.name = "WorldEnvironment"
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.09, 0.10, 0.11)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.45, 0.47, 0.50)
	env.ambient_light_energy = 0.6
	world_env.environment = env
	add_child(world_env)

	var sun := DirectionalLight3D.new()
	sun.name = "Sun"
	sun.rotation_degrees = Vector3(-55.0, 35.0, 0.0)
	sun.light_energy = 1.1
	sun.shadow_enabled = true
	add_child(sun)

	var ground := MeshInstance3D.new()
	ground.name = "Ground"
	var plane := PlaneMesh.new()
	plane.size = Vector2(80.0, 80.0)
	ground.mesh = plane
	ground.material_override = _material(Color(0.27, 0.29, 0.28), 0.95)
	add_child(ground)

	var block_positions := [Vector3(-12, 1, 6), Vector3(4, 1.5, -3), Vector3(10, 1, 12), Vector3(-6, 0.75, -14)]
	for i in block_positions.size():
		var block := MeshInstance3D.new()
		block.name = "ConcreteBlock%02d" % i
		var box := BoxMesh.new()
		box.size = Vector3(4.0, block_positions[i].y * 2.0, 3.0)
		block.mesh = box
		block.material_override = _material(Color(0.42, 0.42, 0.40), 0.9)
		block.position = block_positions[i]
		add_child(block)

	probe = Node3D.new()
	probe.name = "SimProbe"
	probe.position = Vector3(-2.0, 0.75, -6.0)
	add_child(probe)
	var body := MeshInstance3D.new()
	body.name = "Body"
	var body_mesh := BoxMesh.new()
	body_mesh.size = Vector3(1.5, 1.5, 1.5)
	body.mesh = body_mesh
	body.material_override = _material(Color(0.62, 0.45, 0.20), 0.6)
	probe.add_child(body)
	var pointer := MeshInstance3D.new()
	pointer.name = "Pointer"
	var pointer_mesh := BoxMesh.new()
	pointer_mesh.size = Vector3(0.4, 0.4, 1.2)
	pointer.mesh = pointer_mesh
	pointer.material_override = _material(Color(0.9, 0.9, 0.85), 0.5)
	pointer.position = Vector3(0.0, 0.0, -1.0)
	probe.add_child(pointer)


func _material(color: Color, roughness: float) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = roughness
	return mat
