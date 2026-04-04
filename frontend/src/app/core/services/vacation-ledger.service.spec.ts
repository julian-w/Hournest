import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VacationLedgerService } from './vacation-ledger.service';
import { VacationLedgerEntry } from '../models/vacation-ledger-entry.model';

describe('VacationLedgerService', () => {
  let service: VacationLedgerService;
  let httpMock: HttpTestingController;

  const ledgerEntry: VacationLedgerEntry = {
    id: 4,
    user_id: 9,
    year: 2026,
    type: 'carryover',
    days: 3,
    comment: 'Remaining from previous year',
    vacation_id: null,
    created_at: '2026-01-01T00:30:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VacationLedgerService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(VacationLedgerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch the current users ledger for a given year', () => {
    let result: VacationLedgerEntry[] | undefined;

    service.getMyLedger(2026).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/vacation-ledger' && r.params.get('year') === '2026'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [ledgerEntry] });

    expect(result).toEqual([ledgerEntry]);
  });

  it('should fetch another users ledger for a given year', () => {
    let result: VacationLedgerEntry[] | undefined;

    service.getUserLedger(9, 2026).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/admin/users/9/vacation-ledger' && r.params.get('year') === '2026'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [ledgerEntry] });

    expect(result).toEqual([ledgerEntry]);
  });

  it('should add a ledger entry for a user', () => {
    let result: VacationLedgerEntry | undefined;

    service.addEntry(9, {
      year: 2026,
      type: 'bonus',
      days: 1,
      comment: 'Company event bonus day',
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/users/9/vacation-ledger');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      year: 2026,
      type: 'bonus',
      days: 1,
      comment: 'Company event bonus day',
    });
    req.flush({ data: { ...ledgerEntry, type: 'bonus', days: 1, comment: 'Company event bonus day' } });

    expect(result?.type).toBe('bonus');
    expect(result?.days).toBe(1);
  });

  it('should delete a ledger entry for a user', () => {
    service.deleteEntry(9, 4).subscribe();

    const req = httpMock.expectOne('/api/admin/users/9/vacation-ledger/4');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
