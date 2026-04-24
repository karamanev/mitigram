// Minimal @angular/core mock for Jest (Node/CommonJS context).
// Supports the primitives used by the store and component class unit tests.

type Signal<T> = (() => T) & {
  set: (value: T) => void;
  update: (updater: (current: T) => T) => void;
};

const injectables = new Map<unknown, unknown>();

export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const getter = (() => value) as Signal<T>;
  getter.set = (v: T) => {
    value = v;
  };
  getter.update = (fn: (current: T) => T) => {
    value = fn(value);
  };
  return getter;
}

export function computed<T>(fn: () => T): () => T {
  return () => fn();
}

export function Injectable(_options?: unknown) {
  return <T>(target: T) => target;
}

export function Component(_options?: unknown) {
  return <T>(target: T) => target;
}

export function Input(_options?: unknown) {
  return (_target: unknown, _propertyKey: string) => undefined;
}

export function Output(_options?: unknown) {
  return (_target: unknown, _propertyKey: string) => undefined;
}

export function ViewChild(_selector?: unknown, _options?: unknown) {
  return (_target: unknown, _propertyKey: string) => undefined;
}

export function HostListener(_eventName: string, _args?: string[]) {
  return (_target: unknown, _propertyKey: string, _descriptor: PropertyDescriptor) => undefined;
}

export class EventEmitter<T = void> {
  emit(_value?: T): void {
    // No-op by default; tests spy on emit.
  }
}

export class ElementRef<T> {
  constructor(public nativeElement: T) {}
}

export interface OnInit {
  ngOnInit(): void;
}

export interface AfterViewInit {
  ngAfterViewInit(): void;
}

export const ChangeDetectionStrategy = {
  OnPush: 'OnPush',
} as const;

export function inject<T>(token: unknown): T {
  if (!injectables.has(token)) {
    throw new Error(`No injectable registered for token: ${String(token)}`);
  }

  return injectables.get(token) as T;
}

export function __setInjectable<T>(token: unknown, value: T): void {
  injectables.set(token, value);
}

export function __resetInjectables(): void {
  injectables.clear();
}

export function __setInjectables(entries: Array<[unknown, unknown]>): void {
  __resetInjectables();
  for (const [token, value] of entries) {
    injectables.set(token, value);
  }
}
