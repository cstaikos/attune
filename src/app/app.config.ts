import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideMockServices } from './core/services/mock/provide-mock-services';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })), provideMockServices()],
};
