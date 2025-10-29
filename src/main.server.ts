import { bootstrapApplication } from '@angular/platform-browser';
import { BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { serverRoutes } from './app/app.routes.server';

const serverConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),
    ...appConfig.providers
  ]
};

export default (context: BootstrapContext) => {
  return bootstrapApplication(AppComponent, serverConfig, context);
};