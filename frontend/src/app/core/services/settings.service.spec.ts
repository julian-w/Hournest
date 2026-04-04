import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SettingsService } from './settings.service';
import { AppSetting } from '../models/setting.model';

describe('SettingsService', () => {
  let service: SettingsService;
  let httpMock: HttpTestingController;

  const settings: AppSetting[] = [
    { key: 'default_work_days', value: '[1,2,3,4,5]' },
    { key: 'carryover_enabled', value: '1' },
    { key: 'carryover_expiry_date', value: '03-31' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(SettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch admin settings', () => {
    let result: AppSetting[] | undefined;

    service.getSettings().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/settings');
    expect(req.request.method).toBe('GET');
    req.flush({ data: settings });

    expect(result).toEqual(settings);
  });

  it('should update admin settings with a wrapped settings payload', () => {
    service.updateSettings({
      default_work_days: '[1,2,3,4,5]',
      carryover_enabled: '1',
      carryover_expiry_date: '03-31',
    }).subscribe();

    const req = httpMock.expectOne('/api/admin/settings');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      settings: {
        default_work_days: '[1,2,3,4,5]',
        carryover_enabled: '1',
        carryover_expiry_date: '03-31',
      },
    });
    req.flush({});
  });
});
