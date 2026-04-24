import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

void bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideAnimations()],
});
