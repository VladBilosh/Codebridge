import { bootstrapApplication } from '@angular/platform-browser';
import { BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

const serverConfig = {
  providers: [
    provideServerRendering(),
    ...appConfig.providers
  ]
};

export default (context: BootstrapContext) => {
  return bootstrapApplication(AppComponent, serverConfig, context);
};