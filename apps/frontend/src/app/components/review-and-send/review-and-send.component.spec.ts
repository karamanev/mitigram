import { __resetInjectables, __setInjectable } from '../../../__mocks__/angular-core';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { InvitationStore } from '../../store/invitation.store';
import { ReviewAndSendComponent } from './review-and-send.component';

describe('ReviewAndSendComponent', () => {
  let store: InvitationStore;
  let api: Pick<ApiService, 'createInvitation'>;

  beforeEach(() => {
    __resetInjectables();
    store = new InvitationStore();
    api = {
      createInvitation: jest.fn(),
    };

    __setInjectable(InvitationStore, store);
    __setInjectable(ApiService, api);
  });

  function createComponent(): ReviewAndSendComponent {
    const component = new ReviewAndSendComponent();
    component.instrumentId = 'instrument-1';
    return component;
  }

  it('sends invitations and reports success', () => {
    store.addAdHocEmail('alice@example.com');
    (api.createInvitation as jest.Mock).mockReturnValue(
      of({
        id: 'invitation-1',
        instrumentId: 'instrument-1',
        emails: ['alice@example.com'],
        sentAt: '2026-04-24T00:00:00Z',
      }),
    );
    const component = createComponent();
    const sendStateChangeSpy = jest.spyOn(component.sendStateChange, 'emit');

    (component as any).send();

    expect(api.createInvitation).toHaveBeenCalledWith('instrument-1', ['alice@example.com']);
    expect((component as any).sendState()).toBe('success');
    expect(sendStateChangeSpy).toHaveBeenNthCalledWith(1, false);
    expect(sendStateChangeSpy).toHaveBeenNthCalledWith(2, true);
  });

  it('reports an error when sending fails', () => {
    store.addAdHocEmail('alice@example.com');
    (api.createInvitation as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));
    const component = createComponent();
    const sendStateChangeSpy = jest.spyOn(component.sendStateChange, 'emit');

    (component as any).send();

    expect((component as any).sendState()).toBe('error');
    expect((component as any).errorMessage()).toBe('Failed to send. Please try again.');
    expect(sendStateChangeSpy).toHaveBeenNthCalledWith(1, false);
    expect(sendStateChangeSpy).toHaveBeenNthCalledWith(2, false);
  });

  it('uses the backend conflict message when one is provided', () => {
    store.addIndividual({
      id: 'alice',
      name: 'Alice',
      email: 'alice@example.com',
    });
    (api.createInvitation as jest.Mock).mockReturnValue(
      throwError(() => ({
        error: {
          message: 'The recipient alice@example.com was already invited.',
          alreadyInvitedEmails: ['alice@example.com'],
        },
      })),
    );
    const component = createComponent();

    (component as any).send();

    expect((component as any).sendState()).toBe('error');
    expect((component as any).errorMessage()).toBe('Contact Alice is already invited.');
  });
});
