import { AppComponent } from './app.component';

describe('AppComponent', () => {
  afterEach(() => {
    delete (globalThis as { document?: Document }).document;
  });

  it('opens the dialog and stores the previously focused element', () => {
    const previouslyFocused = { focus: jest.fn() } as unknown as HTMLElement;
    (globalThis as { document: Partial<Document> }).document = {
      activeElement: previouslyFocused,
    };

    const component = new AppComponent();

    (component as any).openDialog();

    expect((component as any).dialogOpen()).toBe(true);
    expect((component as any).previouslyFocused).toBe(previouslyFocused);
  });

  it('closes the dialog and restores focus in a microtask', async () => {
    const previouslyFocused = { focus: jest.fn() } as unknown as HTMLElement;
    (globalThis as { document: Partial<Document> }).document = {
      activeElement: previouslyFocused,
    };

    const component = new AppComponent();
    (component as any).openDialog();

    (component as any).closeDialog();
    await new Promise<void>(resolve => queueMicrotask(resolve));

    expect((component as any).dialogOpen()).toBe(false);
    expect(previouslyFocused.focus).toHaveBeenCalledTimes(1);
  });
});
