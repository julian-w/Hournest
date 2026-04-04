import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HolidayService } from './holiday.service';
import { Holiday, HolidayInstance } from '../models/holiday.model';

describe('HolidayService', () => {
  let service: HolidayService;
  let httpMock: HttpTestingController;

  const holiday: Holiday = {
    id: 3,
    name: 'Easter Monday',
    date: '2026-04-06',
    type: 'variable',
    start_year: 2026,
    end_year: null,
  };

  const confirmedInstance: HolidayInstance = {
    holiday_id: 3,
    name: 'Easter Monday',
    type: 'variable',
    year: 2026,
    date: '2026-04-06',
    confirmed: true,
  };

  const unconfirmedInstance: HolidayInstance = {
    holiday_id: 4,
    name: 'Ascension Day',
    type: 'variable',
    year: 2026,
    date: null,
    confirmed: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HolidayService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(HolidayService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch holidays without a year filter by default', () => {
    let result: Holiday[] | undefined;

    service.getHolidays().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/holidays' && !r.params.has('year')
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [holiday] });

    expect(result).toEqual([holiday]);
  });

  it('should fetch holidays with a year query param when provided', () => {
    let result: Holiday[] | undefined;

    service.getHolidays(2026).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/holidays' && r.params.get('year') === '2026'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [holiday] });

    expect(result).toEqual([holiday]);
  });

  it('should fetch holiday instances for a year', () => {
    let result: HolidayInstance[] | undefined;

    service.getHolidayInstances(2026).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/holidays/year/2026');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [confirmedInstance] });

    expect(result).toEqual([confirmedInstance]);
  });

  it('should report a year as confirmed only when every instance is confirmed', () => {
    let allConfirmed: boolean | undefined;
    let partiallyConfirmed: boolean | undefined;

    service.isYearConfirmed(2026).subscribe(value => {
      allConfirmed = value;
    });
    service.isYearConfirmed(2027).subscribe(value => {
      partiallyConfirmed = value;
    });

    const firstReq = httpMock.expectOne('/api/admin/holidays/year/2026');
    expect(firstReq.request.method).toBe('GET');
    firstReq.flush({ data: [confirmedInstance] });

    const secondReq = httpMock.expectOne('/api/admin/holidays/year/2027');
    expect(secondReq.request.method).toBe('GET');
    secondReq.flush({ data: [confirmedInstance, unconfirmedInstance] });

    expect(allConfirmed).toBeTrue();
    expect(partiallyConfirmed).toBeFalse();
  });

  it('should create a holiday with the given payload', () => {
    let result: Holiday | undefined;

    service.createHoliday({
      name: 'Easter Monday',
      date: '2026-04-06',
      type: 'variable',
      start_year: 2026,
      end_year: null,
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/admin/holidays');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Easter Monday',
      date: '2026-04-06',
      type: 'variable',
      start_year: 2026,
      end_year: null,
    });
    req.flush({ data: holiday });

    expect(result).toEqual(holiday);
  });

  it('should update a holiday and a holiday instance date', () => {
    let updatedHoliday: Holiday | undefined;
    let updatedInstance: HolidayInstance | undefined;

    service.updateHoliday(3, {
      name: 'Updated Easter Monday',
      date: '2026-04-06',
      type: 'variable',
      start_year: 2026,
      end_year: null,
    }).subscribe(data => {
      updatedHoliday = data;
    });

    service.updateHolidayDate(3, 2026, '2026-04-07').subscribe(data => {
      updatedInstance = data;
    });

    const holidayReq = httpMock.expectOne('/api/admin/holidays/3');
    expect(holidayReq.request.method).toBe('PATCH');
    expect(holidayReq.request.body).toEqual({
      name: 'Updated Easter Monday',
      date: '2026-04-06',
      type: 'variable',
      start_year: 2026,
      end_year: null,
    });
    holidayReq.flush({ data: { ...holiday, name: 'Updated Easter Monday' } });

    const instanceReq = httpMock.expectOne('/api/admin/holidays/3/year/2026');
    expect(instanceReq.request.method).toBe('PATCH');
    expect(instanceReq.request.body).toEqual({ date: '2026-04-07' });
    instanceReq.flush({ data: { ...confirmedInstance, date: '2026-04-07' } });

    expect(updatedHoliday?.name).toBe('Updated Easter Monday');
    expect(updatedInstance?.date).toBe('2026-04-07');
  });

  it('should delete a holiday', () => {
    service.deleteHoliday(3).subscribe();

    const req = httpMock.expectOne('/api/admin/holidays/3');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
