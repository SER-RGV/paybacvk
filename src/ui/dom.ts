/** Small typed helper for building DOM without a framework. Text is always set with textContent. */
export interface ElementOptions {
  readonly className?: string;
  readonly text?: string;
  readonly attrs?: Readonly<Record<string, string>>;
  readonly onClick?: () => void;
}

export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
  children: readonly (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.className) {
    node.className = options.className;
  }
  if (options.text !== undefined) {
    node.textContent = options.text;
  }
  if (options.attrs) {
    for (const [name, value] of Object.entries(options.attrs)) {
      node.setAttribute(name, value);
    }
  }
  if (options.onClick) {
    const handler = options.onClick;
    node.addEventListener('click', () => handler());
  }
  for (const child of children) {
    node.append(child);
  }
  return node;
}

export function button(label: string, onClick: () => void, extra: Partial<ElementOptions> = {}): HTMLButtonElement {
  return element('button', { ...extra, text: label, onClick, className: extra.className ?? 'btn' }, []);
}
