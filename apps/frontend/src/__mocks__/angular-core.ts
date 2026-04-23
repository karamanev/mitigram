// Minimal @angular/core mock for Jest (Node/CommonJS context).
// Only the primitives used by InvitationStore are implemented.

function signal<T>(initialValue: T) {
  let value = initialValue;
  const getter = () => value;
  getter.set = (v: T) => { value = v; };
  getter.update = (fn: (current: T) => T) => { value = fn(value); };
  return getter;
}

function computed<T>(fn: () => T) {
  return () => fn();
}

function Injectable(_options?: unknown) {
  return (target: unknown) => target;
}

module.exports = { signal, computed, Injectable };
