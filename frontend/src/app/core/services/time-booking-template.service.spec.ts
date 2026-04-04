import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TimeBookingTemplateService } from './time-booking-template.service';
import { TimeBookingTemplate } from '../models/time-booking-template.model';

describe('TimeBookingTemplateService', () => {
  let service: TimeBookingTemplateService;
  let httpMock: HttpTestingController;

  const template: TimeBookingTemplate = {
    id: 7,
    user_id: 3,
    name: 'Standard Day',
    items: [
      {
        id: 11,
        cost_center_id: 21,
        cost_center_name: 'Project Alpha',
        cost_center_code: 'PRJ-ALPHA',
        percentage: 60,
      },
      {
        id: 12,
        cost_center_id: 22,
        cost_center_name: 'Internal',
        cost_center_code: 'INT',
        percentage: 40,
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TimeBookingTemplateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TimeBookingTemplateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch templates', () => {
    let result: TimeBookingTemplate[] | undefined;

    service.getTemplates().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/time-booking-templates');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [template] });

    expect(result).toEqual([template]);
  });

  it('should create a template', () => {
    let result: TimeBookingTemplate | undefined;

    service.createTemplate({
      name: 'Standard Day',
      items: [
        { cost_center_id: 21, percentage: 60 },
        { cost_center_id: 22, percentage: 40 },
      ],
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/time-booking-templates');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Standard Day',
      items: [
        { cost_center_id: 21, percentage: 60 },
        { cost_center_id: 22, percentage: 40 },
      ],
    });
    req.flush({ data: template });

    expect(result).toEqual(template);
  });

  it('should update a template', () => {
    let result: TimeBookingTemplate | undefined;

    service.updateTemplate(7, {
      name: 'Updated Day',
      items: [
        { cost_center_id: 21, percentage: 50 },
        { cost_center_id: 22, percentage: 50 },
      ],
    }).subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/time-booking-templates/7');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      name: 'Updated Day',
      items: [
        { cost_center_id: 21, percentage: 50 },
        { cost_center_id: 22, percentage: 50 },
      ],
    });
    req.flush({ data: { ...template, name: 'Updated Day' } });

    expect(result?.name).toBe('Updated Day');
  });

  it('should delete a template', () => {
    service.deleteTemplate(7).subscribe();

    const req = httpMock.expectOne('/api/time-booking-templates/7');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
