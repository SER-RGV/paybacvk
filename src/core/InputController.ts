import { GAMEPAD } from '../data/tuning';
import { GAMEPAD_BUTTON_ACTIONS, GAMEPAD_BUTTONS, KEY_BINDINGS, type Action } from '../data/bindings';
import type { Vec2 } from '../engine/cameraMath';

/** Input for one frame. Consumed once per frame by readFrame(). */
export interface InputFrame {
  /** Ground pan from keys and the left stick. x right, y down (screen convention), -1..1. */
  readonly pan: Vec2;
  /** Yaw rotation from keys and the right stick, -1..1. Positive turns right. */
  readonly rotate: number;
  /** Continuous zoom rate in -1..1. Positive zooms out. */
  readonly zoomRate: number;
  /** Discrete zoom steps from the mouse wheel. Positive zooms out. */
  readonly zoomSteps: number;
  /** Pixels dragged with the middle button this frame. */
  readonly panPixels: Vec2;
  /** Pixels dragged with the right button this frame (yaw x, pitch y). */
  readonly orbitPixels: Vec2;
  /** Actions triggered this frame (key or button presses, not held state). */
  readonly pressed: readonly Action[];
}

const NO_VECTOR: Vec2 = { x: 0, y: 0 };

export function applyDeadzone(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) < GAMEPAD.deadzone) {
    return 0;
  }
  const scaled = (Math.abs(value) - GAMEPAD.deadzone) / (1 - GAMEPAD.deadzone);
  return Math.sign(value) * Math.min(1, scaled);
}

/**
 * Collects keyboard, mouse, wheel and gamepad input for a canvas and turns it into InputFrame values.
 * It holds no game state. Listeners are removed by dispose().
 */
export class InputController {
  private readonly held = new Set<Action>();
  private pendingPresses: Action[] = [];
  private pointerButton: number | null = null;
  private lastPointer: Vec2 | null = null;
  private accumulatedPan: Vec2 = { x: 0, y: 0 };
  private accumulatedOrbit: Vec2 = { x: 0, y: 0 };
  private wheelSteps = 0;
  private previousButtons = new Map<number, boolean>();
  private readonly abort = new AbortController();

  constructor(private readonly canvas: HTMLCanvasElement) {
    const signal = this.abort.signal;
    window.addEventListener('keydown', this.onKeyDown, { signal });
    window.addEventListener('keyup', this.onKeyUp, { signal });
    window.addEventListener('blur', this.onBlur, { signal });
    canvas.addEventListener('pointerdown', this.onPointerDown, { signal });
    canvas.addEventListener('pointermove', this.onPointerMove, { signal });
    canvas.addEventListener('pointerup', this.onPointerUp, { signal });
    canvas.addEventListener('pointercancel', this.onPointerUp, { signal });
    canvas.addEventListener('wheel', this.onWheel, { signal, passive: false });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault(), { signal });
  }

  /** Returns and clears the accumulated input for this frame. */
  readFrame(): InputFrame {
    const pads = this.readGamepad();
    const panX = this.axis('panLeft', 'panRight') + pads.leftX;
    const panY = this.axis('panUp', 'panDown') + pads.leftY;
    const pan = clampVector({ x: panX, y: panY });
    const rotate = clamp1(this.axis('rotateLeft', 'rotateRight') + pads.rightX);
    const zoomRate = clamp1(this.axis('zoomIn', 'zoomOut') + pads.zoomRate);
    const frame: InputFrame = {
      pan,
      rotate,
      zoomRate,
      zoomSteps: this.wheelSteps,
      panPixels: this.accumulatedPan,
      orbitPixels: this.accumulatedOrbit,
      pressed: [...this.pendingPresses, ...pads.pressed],
    };
    this.pendingPresses = [];
    this.wheelSteps = 0;
    this.accumulatedPan = { x: 0, y: 0 };
    this.accumulatedOrbit = { x: 0, y: 0 };
    return frame;
  }

  isHeld(action: Action): boolean {
    return this.held.has(action);
  }

  dispose(): void {
    this.abort.abort();
    this.held.clear();
    this.pendingPresses = [];
    this.pointerButton = null;
    this.lastPointer = null;
    this.previousButtons.clear();
  }

  private axis(negative: Action, positive: Action): number {
    const neg = this.held.has(negative) ? 1 : 0;
    const pos = this.held.has(positive) ? 1 : 0;
    return pos - neg;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (isTextEntry(event.target) || isButtonActivation(event)) {
      return;
    }
    const action = KEY_BINDINGS[event.code];
    if (!action) {
      return;
    }
    event.preventDefault();
    if (!this.held.has(action) && !event.repeat) {
      this.pendingPresses.push(action);
    }
    this.held.add(action);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const action = KEY_BINDINGS[event.code];
    if (action && !isTextEntry(event.target) && !isButtonActivation(event)) {
      this.held.delete(action);
    }
  };

  private readonly onBlur = (): void => {
    // Releasing focus would otherwise leave keys stuck down.
    this.held.clear();
    this.pointerButton = null;
    this.lastPointer = null;
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 1 && event.button !== 2) {
      return;
    }
    event.preventDefault();
    this.pointerButton = event.button;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.canvas.setPointerCapture(event.pointerId);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.pointerButton === null || this.lastPointer === null) {
      return;
    }
    const dx = event.clientX - this.lastPointer.x;
    const dy = event.clientY - this.lastPointer.y;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    if (this.pointerButton === 1) {
      this.accumulatedPan = { x: this.accumulatedPan.x + dx, y: this.accumulatedPan.y + dy };
    } else {
      this.accumulatedOrbit = { x: this.accumulatedOrbit.x + dx, y: this.accumulatedOrbit.y + dy };
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (this.pointerButton === null) {
      return;
    }
    this.pointerButton = null;
    this.lastPointer = null;
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (event.deltaY === 0) {
      return;
    }
    this.wheelSteps += Math.sign(event.deltaY);
  };

  private readGamepad(): {
    leftX: number;
    leftY: number;
    rightX: number;
    zoomRate: number;
    pressed: Action[];
  } {
    const result = { leftX: 0, leftY: 0, rightX: 0, zoomRate: 0, pressed: [] as Action[] };
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
      return result;
    }
    const pad = navigator.getGamepads().find((candidate) => candidate?.connected) ?? null;
    if (!pad) {
      this.previousButtons.clear();
      return result;
    }
    result.leftX = applyDeadzone(pad.axes[0] ?? 0);
    result.leftY = applyDeadzone(pad.axes[1] ?? 0);
    result.rightX = applyDeadzone(pad.axes[2] ?? 0);
    const out = pad.buttons[GAMEPAD_BUTTONS.leftTrigger]?.value ?? 0;
    const inward = pad.buttons[GAMEPAD_BUTTONS.rightTrigger]?.value ?? 0;
    result.zoomRate = applyDeadzone(out) - applyDeadzone(inward);
    for (const [index, action] of GAMEPAD_BUTTON_ACTIONS) {
      const down = pad.buttons[index]?.pressed === true;
      const wasDown = this.previousButtons.get(index) ?? false;
      if (down && !wasDown) {
        result.pressed.push(action);
      }
      this.previousButtons.set(index, down);
    }
    return result;
  }
}

/** True when the focused element uses the key for typing or value entry (never for the game). */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * Space and Enter on a focused button activate the button, so the game must not also act on them.
 * Other keys still control the game while a HUD button has focus.
 */
function isButtonActivation(event: KeyboardEvent): boolean {
  return event.target instanceof HTMLButtonElement && (event.code === 'Space' || event.code === 'Enter');
}

function clamp1(value: number): number {
  return Math.min(1, Math.max(-1, value));
}

function clampVector(vector: Vec2): Vec2 {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= 1) {
    return length === 0 ? NO_VECTOR : vector;
  }
  return { x: vector.x / length, y: vector.y / length };
}
