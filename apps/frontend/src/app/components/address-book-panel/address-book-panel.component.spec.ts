import { AddressBookPanelComponent } from './address-book-panel.component';

describe('AddressBookPanelComponent', () => {
  it('defaults to the individuals tab', () => {
    const component = new AddressBookPanelComponent();

    expect((component as any).activeTab()).toBe('individuals');
  });

  it('keeps tab state in a writable signal', () => {
    const component = new AddressBookPanelComponent();

    (component as any).activeTab.set('groups');

    expect((component as any).activeTab()).toBe('groups');
  });
});
