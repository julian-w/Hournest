import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AbsenceService } from './absence.service';
import { Absence } from '../models/absence.model';

describe('AbsenceService', () => {
  let service: AbsenceService;
  let httpMock: HttpTestingController;

  const absence: Absence = {
    id: 3,
    user_id: 7,
    user_name: 'Alex Example',
    start_date: '2026-04-08',
    end_date: '2026-04-09',
    type: 'illness',
    scope: 'full_day',
    status: 'reported',
    comment: 'Flu',
    admin_comment: null,
    reviewed_by: null,
    reviewer_name: undefined,
    reviewed_at: null,
    created_at: '2026-04-08T07:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AbsenceService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AbsenceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch my absences from the API', () => {
    let result: Absence[] | undefined;

    service.getMyAbsences().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/absences/mine');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [absence] });

    expect(result).toEqual([absence]);
  });

  it('should post the exact absence payload when reporting absence', () => {
    let result: Absence | undefined;

    const payload = {
      start_date: '2026-04-08',
      end_date: '2026-04-09',
      type: 'special_leave' as const,
      scope: 'morning' as const,
      comment: 'Family matter',
    };

    service.reportAbsence(payload).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/absences');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: absence });

    expect(result).toEqual(absence);
  });

  it('should delete an absence by id', () => {
    service.cancelAbsence(12).subscribe();

    const req = httpMock.expectOne('/api/absences/12');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
