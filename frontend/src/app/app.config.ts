import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { mockInterceptor } from './core/mock/mock.interceptor';
import { AuthService } from './core/services/auth.service';
import { MockService } from './core/mock/mock.service';
import { environment } from '../environments/environment';

function initializeApp(authService: AuthService, mockService: MockService): () => Promise<void> {
  return async () => {
    if (typeof window !== 'undefined' && !environment.production) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mock') === 'true' || environment.mockMode) {
        mockService.activate();
      }
    }
    await authService.loadUser();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([mockInterceptor, credentialsInterceptor])),
    provideAnimationsAsync(),
    provideTranslateService({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useClass: TranslateHttpLoader,
      },
    }),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService, MockService],
      multi: true,
    },
  ],
};
