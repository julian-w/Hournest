import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TimeTrackingService } from './time-tracking.service';
import { TimeEntry } from '../models/time-entry.model';
import { TimeBooking } from '../models/time-booking.model';

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;
  let httpMock: HttpTestingController;

  const timeEntry: TimeEntry = {
    id: 1,
    user_id: 7,
    date: '2026-04-07',
    start_time: '08:00',
    end_time: '17:00',
    break_minutes: 30,
    net_working_minutes: 510,
  };

  const timeBooking: TimeBooking = {
    id: 2,
    user_id: 7,
    date: '2026-04-07',
    cost_center_id: 12,
    cost_center_name: 'Project Alpha',
    cost_center_code: 'PRJ-ALPHA',
    percentage: 100,
    comment: 'Feature work',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TimeTrackingService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TimeTrackingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch time entries with from/to query params', () => {
    let result: TimeEntry[] | undefined;

    service.getTimeEntries('2026-04-01', '2026-04-30').subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/time-entries'
      && r.params.get('from') === '2026-04-01'
      && r.params.get('to') === '2026-04-30'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [timeEntry] });

    expect(result).toEqual([timeEntry]);
  });

  it('should save a time entry for a date', () => {
    let result: TimeEntry | undefined;

    service.saveTimeEntry('2026-04-07', {
      start_time: '08:00',
      end_time: '17:00',
      break_minutes: 30,
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/time-entries/2026-04-07');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      start_time: '08:00',
      end_time: '17:00',
      break_minutes: 30,
    });
    req.flush({ data: timeEntry });

    expect(result).toEqual(timeEntry);
  });

  it('should delete a time entry by date', () => {
    service.deleteTimeEntry('2026-04-07').subscribe();

    const req = httpMock.expectOne('/api/time-entries/2026-04-07');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should fetch time bookings with from/to query params', () => {
    let result: TimeBooking[] | undefined;

    service.getTimeBookings('2026-04-01', '2026-04-30').subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/time-bookings'
      && r.params.get('from') === '2026-04-01'
      && r.params.get('to') === '2026-04-30'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [timeBooking] });

    expect(result).toEqual([timeBooking]);
  });

  it('should save time bookings for a date', () => {
    let result: TimeBooking[] | undefined;

    const bookings = [
      { cost_center_id: 12, percentage: 60, comment: 'Project Alpha' },
      { cost_center_id: 13, percentage: 40, comment: 'Internal' },
    ];

    service.saveTimeBookings('2026-04-07', bookings).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/time-bookings/2026-04-07');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ bookings });
    req.flush({ data: [timeBooking] });

    expect(result).toEqual([timeBooking]);
  });
});
