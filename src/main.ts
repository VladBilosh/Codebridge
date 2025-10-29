import { renderModule } from '@angular/platform-server';
import { AppComponent } from './app/app.component';

export function run(url = '/') {
  return renderModule(AppComponent, {
    document: '<app-root></app-root>',
    extraProviders: []
  });
}