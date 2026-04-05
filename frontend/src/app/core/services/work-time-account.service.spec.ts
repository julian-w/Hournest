import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkTimeAccountService } from './work-time-account.service';
import { WorkTimeAccountEntry } from '../models/work-time-account-entry.model';

describe('WorkTimeAccountService', () => {
  let service: WorkTimeAccountService;
  let httpMock: HttpTestingController;

  const entry: WorkTimeAccountEntry = {
    id: 4,
    user_id: 9,
    effective_date: '2026-04-06',
    type: 'worked',
    minutes_delta: 60,
    balance_after: 120,
    comment: 'Worked 540 min vs target 480 min',
    created_at: '2026-04-06T17:00:00Z',
    created_by: null,
    created_by_name: null,
    source_type: 'time_entry',
    source_id: 12,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkTimeAccountService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(WorkTimeAccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch the current users work time ledger for a given year', () => {
    let result: WorkTimeAccountEntry[] | undefined;

    service.getMyLedger(2026).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/work-time-account' && r.params.get('year') === '2026'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [entry] });

    expect(result).toEqual([entry]);
  });

  it('should fetch another users work time ledger for a given year', () => {
    let result: WorkTimeAccountEntry[] | undefined;

    service.getUserLedger(9, 2026).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/admin/users/9/work-time-account' && r.params.get('year') === '2026'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [entry] });

    expect(result).toEqual([entry]);
  });

  it('should add a manual work time account entry for a user', () => {
    let result: WorkTimeAccountEntry | undefined;

    service.addEntry(9, {
      effective_date: '2026-04-06',
      type: 'manual_adjustment',
      minutes_delta: -30,
      comment: 'Correction',
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/users/9/work-time-account');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      effective_date: '2026-04-06',
      type: 'manual_adjustment',
      minutes_delta: -30,
      comment: 'Correction',
    });
    req.flush({ data: { ...entry, type: 'manual_adjustment', minutes_delta: -30, comment: 'Correction' } });

    expect(result?.type).toBe('manual_adjustment');
  });

  it('should delete a manual work time account entry for a user', () => {
    service.deleteEntry(9, 4).subscribe();

    const req = httpMock.expectOne('/api/admin/users/9/work-time-account/4');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
