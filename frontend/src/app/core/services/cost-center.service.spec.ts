import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CostCenterService } from './cost-center.service';
import { CostCenter } from '../models/cost-center.model';

describe('CostCenterService', () => {
  let service: CostCenterService;
  let httpMock: HttpTestingController;

  const costCenter: CostCenter = {
    id: 12,
    code: 'PRJ-ALPHA',
    name: 'Project Alpha',
    description: 'Main delivery project',
    is_system: false,
    is_active: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CostCenterService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CostCenterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch available cost centers', () => {
    let result: CostCenter[] | undefined;

    service.getAvailableCostCenters().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/cost-centers');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [costCenter] });

    expect(result).toEqual([costCenter]);
  });

  it('should fetch favorite cost centers', () => {
    let result: CostCenter[] | undefined;

    service.getFavorites().subscribe(data => {
      result = data;
    });

    const req = httpMock.expectOne('/api/cost-center-favorites');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [costCenter] });

    expect(result).toEqual([costCenter]);
  });

  it('should add a favorite cost center', () => {
    service.addFavorite(12).subscribe();

    const req = httpMock.expectOne('/api/cost-center-favorites');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cost_center_id: 12 });
    req.flush({});
  });

  it('should remove a favorite cost center', () => {
    service.removeFavorite(12).subscribe();

    const req = httpMock.expectOne('/api/cost-center-favorites/12');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should reorder favorite cost centers', () => {
    service.reorderFavorites([12, 15, 18]).subscribe();

    const req = httpMock.expectOne('/api/cost-center-favorites/reorder');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ cost_center_ids: [12, 15, 18] });
    req.flush({});
  });
});
