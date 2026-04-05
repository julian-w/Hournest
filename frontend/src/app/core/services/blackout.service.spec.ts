import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BlackoutService } from './blackout.service';
import { BlackoutPeriod } from '../models/blackout-period.model';

describe('BlackoutService', () => {
  let service: BlackoutService;
  let httpMock: HttpTestingController;

  const blackout: BlackoutPeriod = {
    id: 6,
    type: 'freeze',
    start_date: '2026-12-20',
    end_date: '2026-12-31',
    reason: 'Year-end vacation freeze',
    created_at: '2026-11-01T10:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BlackoutService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(BlackoutService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch blackout periods', () => {
    let result: BlackoutPeriod[] | undefined;

    service.getBlackouts().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/blackouts');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [blackout] });

    expect(result).toEqual([blackout]);
  });

  it('should create a blackout period', () => {
    let result: BlackoutPeriod | undefined;

    service.createBlackout({
      type: 'freeze',
      start_date: '2026-12-20',
      end_date: '2026-12-31',
      reason: 'Year-end vacation freeze',
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/blackouts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      type: 'freeze',
      start_date: '2026-12-20',
      end_date: '2026-12-31',
      reason: 'Year-end vacation freeze',
    });
    req.flush({ data: blackout });

    expect(result).toEqual(blackout);
  });

  it('should update a blackout period', () => {
    let result: BlackoutPeriod | undefined;

    service.updateBlackout(6, {
      type: 'company_holiday',
      start_date: '2026-12-24',
      end_date: '2026-12-24',
      reason: 'Company closure',
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/blackouts/6');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      type: 'company_holiday',
      start_date: '2026-12-24',
      end_date: '2026-12-24',
      reason: 'Company closure',
    });
    req.flush({
      data: {
        ...blackout,
        type: 'company_holiday',
        start_date: '2026-12-24',
        end_date: '2026-12-24',
        reason: 'Company closure',
      },
    });

    expect(result?.type).toBe('company_holiday');
    expect(result?.reason).toBe('Company closure');
  });

  it('should delete a blackout period', () => {
    service.deleteBlackout(6).subscribe();

    const req = httpMock.expectOne('/api/admin/blackouts/6');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should return the first matching blackout when a date range is blocked', () => {
    let result: BlackoutPeriod | null | undefined;

    service.checkDate('2026-12-24', '2026-12-24').subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/blackouts/check'
      && r.params.get('start_date') === '2026-12-24'
      && r.params.get('end_date') === '2026-12-24'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [blackout] });

    expect(result).toEqual(blackout);
  });

  it('should return null when no blackout matches the date range', () => {
    let result: BlackoutPeriod | null | undefined;

    service.checkDate('2026-12-10', '2026-12-10').subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/blackouts/check'
      && r.params.get('start_date') === '2026-12-10'
      && r.params.get('end_date') === '2026-12-10'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });

    expect(result).toBeNull();
  });

  it('should fetch all matching blackouts for a date range', () => {
    let result: BlackoutPeriod[] | undefined;

    service.getMatchingBlackouts('2026-12-24', '2026-12-26').subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/blackouts/check'
      && r.params.get('start_date') === '2026-12-24'
      && r.params.get('end_date') === '2026-12-26'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [blackout] });

    expect(result).toEqual([blackout]);
  });
});
