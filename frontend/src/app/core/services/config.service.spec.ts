import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load oauth config from the API', async () => {
    const loadPromise = service.loadConfig();

    const req = httpMock.expectOne('/api/auth/config');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { oauth_enabled: false } });

    await loadPromise;

    expect(service.isOAuthEnabled()).toBeFalse();
  });

  it('should fall back to oauth enabled on request failure', async () => {
    const loadPromise = service.loadConfig();

    const req = httpMock.expectOne('/api/auth/config');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });

    await loadPromise;

    expect(service.isOAuthEnabled()).toBeTrue();
  });
});
