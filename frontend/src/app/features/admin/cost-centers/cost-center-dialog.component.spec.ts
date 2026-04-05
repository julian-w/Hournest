import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CostCenter } from '../../../core/models/cost-center.model';
import { AdminService } from '../../../core/services/admin.service';
import { CostCenterDialogComponent } from './admin-cost-centers.component';

describe('CostCenterDialogComponent', () => {
  let adminServiceStub: {
    createCostCenter: jasmine.Spy;
    updateCostCenter: jasmine.Spy;
  };
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  const existingCostCenter: CostCenter = {
    id: 8,
    code: 'OPS',
    name: 'Operations',
    description: 'Operations and support',
    is_system: false,
    is_active: true,
  };

  async function configure(data: CostCenter | null): Promise<void> {
    await TestBed.resetTestingModule();

    adminServiceStub = {
      createCostCenter: jasmine.createSpy('createCostCenter').and.returnValue(of(existingCostCenter)),
      updateCostCenter: jasmine.createSpy('updateCostCenter').and.returnValue(of(existingCostCenter)),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        CostCenterDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: AdminService, useValue: adminServiceStub },
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  }

  it('should initialize edit fields from dialog data', async () => {
    await configure(existingCostCenter);
    const fixture = TestBed.createComponent(CostCenterDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.code).toBe('OPS');
    expect(fixture.componentInstance.name).toBe('Operations');
    expect(fixture.componentInstance.description).toBe('Operations and support');
    expect(fixture.componentInstance.isActive).toBeTrue();
  });

  it('should create a cost center with optional description omitted', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(CostCenterDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.code = 'DEV';
    fixture.componentInstance.name = 'Development';
    fixture.componentInstance.description = '';

    fixture.componentInstance.save();

    expect(adminServiceStub.createCostCenter).toHaveBeenCalledWith({
      code: 'DEV',
      name: 'Development',
      description: undefined,
    });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should update a cost center without changing the code', async () => {
    await configure(existingCostCenter);
    const fixture = TestBed.createComponent(CostCenterDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.code = 'SHOULD-NOT-BE-SENT';
    fixture.componentInstance.name = 'Operations Updated';
    fixture.componentInstance.description = '';
    fixture.componentInstance.isActive = false;

    fixture.componentInstance.save();

    expect(adminServiceStub.updateCostCenter).toHaveBeenCalledWith(8, {
      name: 'Operations Updated',
      description: undefined,
      is_active: false,
    });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });
});
