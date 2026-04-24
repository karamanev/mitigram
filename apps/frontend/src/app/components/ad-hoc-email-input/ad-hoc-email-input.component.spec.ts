import { __resetInjectables, __setInjectable } from '../../../__mocks__/angular-core';
import { AdHocEmailInputComponent } from './ad-hoc-email-input.component';
import { InvitationStore } from '../../store/invitation.store';

describe('AdHocEmailInputComponent', () => {
  let store: InvitationStore;

  beforeEach(() => {
    __resetInjectables();
    store = new InvitationStore();
    __setInjectable(InvitationStore, store);
  });

  it('focuses the input after view init', () => {
    const component = new AdHocEmailInputComponent();
    const focus = jest.fn();

    (component as any).inputEl = { nativeElement: { focus } };
    component.ngAfterViewInit();

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('clears feedback on input', () => {
    const component = new AdHocEmailInputComponent();
    (component as any).feedback.set({ tone: 'error', message: 'bad input' });

    (component as any).onInput();

    expect((component as any).feedback()).toBeNull();
  });

  it('adds a valid email on enter and reports success', () => {
    const component = new AdHocEmailInputComponent();
    const preventDefault = jest.fn();
    const input = { value: 'Alice@Example.com' } as HTMLInputElement;

    (component as any).onKeydown({ key: 'Enter', preventDefault } as unknown as KeyboardEvent, input);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(store.adHocEmails()).toEqual(['alice@example.com']);
    expect(input.value).toBe('');
    expect((component as any).feedback()).toEqual({
      tone: 'success',
      message: 'alice@example.com added to recipients.',
    });
  });

  it('reports invalid emails on blur without adding them', () => {
    const component = new AdHocEmailInputComponent();
    const input = { value: 'invalid' } as HTMLInputElement;

    (component as any).onBlur(input);

    expect(store.adHocEmails()).toEqual([]);
    expect((component as any).feedback()).toEqual({
      tone: 'error',
      message: 'Enter a valid email address such as name@company.com.',
    });
  });

  it('reports when an email already exists from another source', () => {
    store.addIndividual({ id: 'alice', name: 'Alice', email: 'alice@example.com' });
    const component = new AdHocEmailInputComponent();
    const input = { value: 'alice@example.com' } as HTMLInputElement;

    (component as any).onBlur(input);

    expect((component as any).feedback()).toEqual({
      tone: 'info',
      message: 'alice@example.com is already included via Alice.',
    });
  });

  it('adds valid pasted emails and reports skipped duplicates', () => {
    store.addAdHocEmail('existing@example.com');
    const component = new AdHocEmailInputComponent();
    const preventDefault = jest.fn();
    const input = { value: 'ignored' } as HTMLInputElement;
    const event = {
      preventDefault,
      clipboardData: {
        getData: () => 'new@example.com, existing@example.com',
      },
    } as unknown as ClipboardEvent;

    (component as any).onPaste(event, input);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('');
    expect(store.adHocEmails()).toEqual(['existing@example.com', 'new@example.com']);
    expect((component as any).feedback()).toEqual({
      tone: 'success',
      message: 'Added 1 email. 1 already included recipient was skipped.',
    });
  });

  it('reports invalid pasted entries as an error summary', () => {
    const component = new AdHocEmailInputComponent();
    const event = {
      preventDefault: jest.fn(),
      clipboardData: {
        getData: () => 'ok@example.com, invalid',
      },
    } as unknown as ClipboardEvent;
    const input = { value: 'ignored' } as HTMLInputElement;

    (component as any).onPaste(event, input);

    expect(store.adHocEmails()).toEqual(['ok@example.com']);
    expect((component as any).feedback()).toEqual({
      tone: 'error',
      message: 'Added 1 email. 1 invalid entry: invalid.',
    });
  });
});
