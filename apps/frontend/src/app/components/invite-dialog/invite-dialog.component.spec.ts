import { ElementRef } from '@angular/core';
import { __resetInjectables, __setInjectable } from '../../../__mocks__/angular-core';
import type { Contact, Group } from '@mitigram/shared';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { InvitationStore } from '../../store/invitation.store';
import { InviteDialogComponent } from './invite-dialog.component';

describe('InviteDialogComponent', () => {
  const contacts: Contact[] = [{ id: 'alice', name: 'Alice', email: 'alice@example.com' }];
  const groups: Group[] = [
    {
      id: 'group-alpha',
      name: 'Alpha',
      members: [{ id: 'alice', name: 'Alice', email: 'alice@example.com' }],
    },
  ];

  let store: InvitationStore;
  let api: Pick<ApiService, 'getContacts' | 'getGroups'>;
  let hostElement: {
    querySelectorAll: jest.Mock<HTMLElement[], [string]>;
  };

  beforeEach(() => {
    __resetInjectables();
    store = new InvitationStore();
    api = {
      getContacts: jest.fn(),
      getGroups: jest.fn(),
    };
    hostElement = {
      querySelectorAll: jest.fn(),
    };

    __setInjectable(InvitationStore, store);
    __setInjectable(ApiService, api);
    __setInjectable(ElementRef, new ElementRef(hostElement as unknown as HTMLElement));
  });

  afterEach(() => {
    delete (globalThis as { document?: Document }).document;
  });

  function createComponent(): InviteDialogComponent {
    const component = new InviteDialogComponent();
    component.instrumentId = 'instrument-1';
    return component;
  }

  it('resets store state and loads address book data on init', () => {
    store.addAdHocEmail('stale@example.com');
    (api.getContacts as jest.Mock).mockReturnValue(of(contacts));
    (api.getGroups as jest.Mock).mockReturnValue(of(groups));
    const component = createComponent();

    component.ngOnInit();

    expect(store.adHocEmails()).toEqual([]);
    expect(store.contacts()).toEqual(contacts);
    expect(store.groups()).toEqual(groups);
    expect((component as any).loading()).toBe(false);
    expect((component as any).error()).toBeNull();
  });

  it('sets an error state when loading fails', () => {
    (api.getContacts as jest.Mock).mockReturnValue(of(contacts));
    (api.getGroups as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));
    const component = createComponent();

    component.ngOnInit();

    expect((component as any).loading()).toBe(false);
    expect((component as any).error()).toBe('Failed to load the address book.');
  });

  it('opens and closes the review state', () => {
    const component = createComponent();

    (component as any).openReview();
    expect((component as any).showReview()).toBe(true);
    expect((component as any).reviewSuccess()).toBe(false);

    (component as any).handleReviewBack();
    expect((component as any).showReview()).toBe(false);
  });

  it('resets view state and emits close when closing', () => {
    (api.getContacts as jest.Mock).mockReturnValue(of(contacts));
    (api.getGroups as jest.Mock).mockReturnValue(of(groups));
    store.addAdHocEmail('alice@example.com');
    const component = createComponent();
    const emitSpy = jest.spyOn(component.closed, 'emit');

    (component as any).showReview.set(true);
    (component as any).reviewSuccess.set(true);
    (component as any).close();

    expect((component as any).showReview()).toBe(false);
    expect((component as any).reviewSuccess()).toBe(false);
    expect(store.finalEmails()).toEqual([]);
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('closes on escape', () => {
    const component = createComponent();
    const closeSpy = jest.spyOn(component as any, 'close');

    (component as any).onEscape();

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('moves focus to the first item when tabbing forward from the last focusable', () => {
    const first = { offsetParent: {}, focus: jest.fn() } as unknown as HTMLElement;
    const last = { offsetParent: {}, focus: jest.fn() } as unknown as HTMLElement;
    hostElement.querySelectorAll.mockReturnValue([first, last]);
    (globalThis as { document: Partial<Document> }).document = { activeElement: last };
    const component = createComponent();
    const event = { preventDefault: jest.fn() } as unknown as KeyboardEvent;

    (component as any).onTab(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(first.focus).toHaveBeenCalledTimes(1);
  });

  it('moves focus to the last item when shift-tabbing from the first focusable', () => {
    const first = { offsetParent: {}, focus: jest.fn() } as unknown as HTMLElement;
    const last = { offsetParent: {}, focus: jest.fn() } as unknown as HTMLElement;
    hostElement.querySelectorAll.mockReturnValue([first, last]);
    (globalThis as { document: Partial<Document> }).document = { activeElement: first };
    const component = createComponent();
    const event = { preventDefault: jest.fn() } as unknown as KeyboardEvent;

    (component as any).onShiftTab(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(last.focus).toHaveBeenCalledTimes(1);
  });
});
