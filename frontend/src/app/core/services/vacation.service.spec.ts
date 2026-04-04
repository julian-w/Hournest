import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VacationService } from './vacation.service';
import { Vacation } from '../models/vacation.model';

describe('VacationService', () => {
  let service: VacationService;
  let httpMock: HttpTestingController;

  const vacation: Vacation = {
    id: 1,
    user_id: 7,
    user_name: 'Alex Example',
    start_date: '2026-04-06',
    end_date: '2026-04-10',
    scope: 'full_day',
    workdays: 5,
    status: 'pending',
    comment: 'Spring break',
    reviewed_by: null,
    reviewer_name: undefined,
    reviewed_at: null,
    created_at: '2026-04-01T08:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VacationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(VacationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch team vacations from the API', () => {
    let result: Vacation[] | undefined;

    service.getTeamVacations().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/vacations');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [vacation] });

    expect(result).toEqual([vacation]);
  });

  it('should fetch the current users vacations from the API', () => {
    let result: Vacation[] | undefined;

    service.getMyVacations().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/vacations/mine');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [vacation] });

    expect(result).toEqual([vacation]);
  });

  it('should send the expected payload when requesting vacation', () => {
    let result: Vacation | undefined;

    service.requestVacation('2026-05-01', '2026-05-05', 'full_day', 'Family trip').subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/vacations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      start_date: '2026-05-01',
      end_date: '2026-05-05',
      scope: 'full_day',
      comment: 'Family trip',
    });
    req.flush({ data: vacation });

    expect(result).toEqual(vacation);
  });

  it('should send null comment when requesting vacation without a comment', () => {
    service.requestVacation('2026-05-01', '2026-05-05').subscribe();

    const req = httpMock.expectOne('/api/vacations');
    expect(req.request.body.scope).toBe('full_day');
    expect(req.request.body.comment).toBeNull();
    req.flush({ data: vacation });
  });

  it('should send a half-day scope when requesting half-day vacation', () => {
    service.requestVacation('2026-05-01', '2026-05-01', 'morning').subscribe();

    const req = httpMock.expectOne('/api/vacations');
    expect(req.request.body).toEqual({
      start_date: '2026-05-01',
      end_date: '2026-05-01',
      scope: 'morning',
      comment: null,
    });
    req.flush({ data: { ...vacation, scope: 'morning', workdays: 0.5 } });
  });

  it('should delete vacation by id', () => {
    service.cancelVacation(42).subscribe();

    const req = httpMock.expectOne('/api/vacations/42');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
