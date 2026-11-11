/** Logical actions. Devices map to these; game code never reads raw key codes. */
export type Action =
  | 'panUp'
  | 'panDown'
  | 'panLeft'
  | 'panRight'
  | 'rotateLeft'
  | 'rotateRight'
  | 'zoomIn'
  | 'zoomOut'
  | 'togglePause'
  | 'speedUp'
  | 'speedDown'
  | 'back';

/** Keyboard bindings by KeyboardEvent.code (physical key, layout independent). */
export const KEY_BINDINGS: Readonly<Record<string, Action>> = {
  KeyW: 'panUp',
  ArrowUp: 'panUp',
  KeyS: 'panDown',
  ArrowDown: 'panDown',
  KeyA: 'panLeft',
  ArrowLeft: 'panLeft',
  KeyD: 'panRight',
  ArrowRight: 'panRight',
  KeyQ: 'rotateLeft',
  KeyE: 'rotateRight',
  Equal: 'zoomIn',
  NumpadAdd: 'zoomIn',
  Minus: 'zoomOut',
  NumpadSubtract: 'zoomOut',
  Space: 'togglePause',
  BracketRight: 'speedUp',
  BracketLeft: 'speedDown',
  Escape: 'back',
};

/** Standard Gamepad API button indices (the "standard" mapping). */
export const GAMEPAD_BUTTONS = {
  confirmA: 0,
  backB: 1,
  leftTrigger: 6,
  rightTrigger: 7,
  start: 9,
  dpadUp: 12,
  dpadDown: 13,
} as const;

export const GAMEPAD_BUTTON_ACTIONS: ReadonlyArray<readonly [number, Action]> = [
  [GAMEPAD_BUTTONS.start, 'togglePause'],
  [GAMEPAD_BUTTONS.dpadUp, 'speedUp'],
  [GAMEPAD_BUTTONS.dpadDown, 'speedDown'],
  [GAMEPAD_BUTTONS.backB, 'back'],
];
