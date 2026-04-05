import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkScheduleService } from './work-schedule.service';
import { WorkSchedule } from '../models/work-schedule.model';

describe('WorkScheduleService', () => {
  let service: WorkScheduleService;
  let httpMock: HttpTestingController;

  const schedule: WorkSchedule = {
    id: 3,
    user_id: 9,
    start_date: '2026-01-01',
    end_date: null,
    work_days: [1, 2, 3, 4, 5],
    weekly_target_minutes: 2400,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkScheduleService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(WorkScheduleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch own work schedules', () => {
    let result: WorkSchedule[] | undefined;

    service.getMyWorkSchedules().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/work-schedules/mine');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [schedule] });

    expect(result).toEqual([schedule]);
  });
});
