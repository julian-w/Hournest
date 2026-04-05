import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { CostCenter } from '../../../core/models/cost-center.model';
import { AdminCostCentersComponent } from './admin-cost-centers.component';

describe('AdminCostCentersComponent', () => {
  let adminServiceStub: {
    getCostCenters: jasmine.Spy;
    deleteCostCenter: jasmine.Spy;
  };

  const costCenters: CostCenter[] = [
    {
      id: 1,
      code: 'SYS-DEFAULT',
      name: 'System Default',
      description: 'Default fallback',
      is_system: true,
      is_active: true,
    },
    {
      id: 2,
      code: 'PRJ-ALPHA',
      name: 'Project Alpha',
      description: 'Main delivery project',
      is_system: false,
      is_active: true,
    },
    {
      id: 3,
      code: 'OPS-LEGACY',
      name: 'Legacy Operations',
      description: null,
      is_system: false,
      is_active: false,
    },
  ];

  beforeEach(async () => {
    adminServiceStub = {
      getCostCenters: jasmine.createSpy('getCostCenters').and.returnValue(of(costCenters)),
      deleteCostCenter: jasmine.createSpy('deleteCostCenter').and.returnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [
        AdminCostCentersComponent,
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
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load cost centers on init', () => {
    const fixture = TestBed.createComponent(AdminCostCentersComponent);
    fixture.detectChanges();

    expect(adminServiceStub.getCostCenters).toHaveBeenCalled();
    expect(fixture.componentInstance.costCenters()).toEqual(costCenters);
    expect(fixture.nativeElement.textContent).toContain('System Default');
    expect(fixture.nativeElement.textContent).toContain('Project Alpha');
    expect(fixture.nativeElement.textContent).toContain('Legacy Operations');
  });

  it('should open the create dialog and reload after a successful close', () => {
    const fixture = TestBed.createComponent(AdminCostCentersComponent);
    fixture.detectChanges();
    const dialogOpenSpy = spyOn((fixture.componentInstance as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(true),
      componentInstance: {},
      componentRef: null,
      disableClose: false,
      id: 'dialog',
      keydownEvents: () => new EventEmitter<KeyboardEvent>(),
      backdropClick: () => new EventEmitter<MouseEvent>(),
      beforeClosed: () => of(undefined),
      close: () => undefined,
      updatePosition: () => undefined,
      updateSize: () => undefined,
      addPanelClass: () => undefined,
      removePanelClass: () => undefined,
      afterOpened: () => of(undefined),
      getState: () => 0,
    } as never);

    adminServiceStub.getCostCenters.calls.reset();

    fixture.componentInstance.openDialog();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(adminServiceStub.getCostCenters).toHaveBeenCalled();
  });

  it('should open the edit dialog with cost center data and not reload when canceled', () => {
    const fixture = TestBed.createComponent(AdminCostCentersComponent);
    fixture.detectChanges();
    const dialogOpenSpy = spyOn((fixture.componentInstance as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(false),
      componentInstance: {},
      componentRef: null,
      disableClose: false,
      id: 'dialog',
      keydownEvents: () => new EventEmitter<KeyboardEvent>(),
      backdropClick: () => new EventEmitter<MouseEvent>(),
      beforeClosed: () => of(undefined),
      close: () => undefined,
      updatePosition: () => undefined,
      updateSize: () => undefined,
      addPanelClass: () => undefined,
      removePanelClass: () => undefined,
      afterOpened: () => of(undefined),
      getState: () => 0,
    } as never);

    adminServiceStub.getCostCenters.calls.reset();

    fixture.componentInstance.openDialog(costCenters[1]);

    expect(dialogOpenSpy).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
      data: costCenters[1],
    }));
    expect(adminServiceStub.getCostCenters).not.toHaveBeenCalled();
  });

  it('should archive a cost center, show feedback, and reload the list', () => {
    const fixture = TestBed.createComponent(AdminCostCentersComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    adminServiceStub.getCostCenters.calls.reset();

    fixture.componentInstance.deleteCostCenter(costCenters[1]);

    expect(adminServiceStub.deleteCostCenter).toHaveBeenCalledWith(2);
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_cost_centers.archived', 'common.ok', { duration: 3000 });
    expect(adminServiceStub.getCostCenters).toHaveBeenCalled();
  });
});
