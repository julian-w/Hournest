import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppSetting } from '../../../core/models/setting.model';
import { SettingsService } from '../../../core/services/settings.service';
import { AdminSettingsComponent } from './admin-settings.component';

describe('AdminSettingsComponent', () => {
  let settingsServiceStub: {
    getSettings: jasmine.Spy;
    updateSettings: jasmine.Spy;
  };

  const settings: AppSetting[] = [
    { key: 'default_work_days', value: '[1,2,3,4,5]' },
    { key: 'weekend_is_free', value: '1' },
    { key: 'carryover_enabled', value: '1' },
    { key: 'carryover_expiry_date', value: '31.03' },
    { key: 'vacation_booking_start', value: '01.10' },
  ];

  beforeEach(async () => {
    settingsServiceStub = {
      getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settings)),
      updateSettings: jasmine.createSpy('updateSettings').and.returnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [
        AdminSettingsComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: SettingsService, useValue: settingsServiceStub },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should load settings on init and apply them to the form state', () => {
    const fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();

    expect(settingsServiceStub.getSettings).toHaveBeenCalled();
    expect(fixture.componentInstance.weekendFree).toBeTrue();
    expect(fixture.componentInstance.carryoverEnabled).toBeTrue();
    expect(fixture.componentInstance.carryoverExpiry).toBe('31.03');
    expect(fixture.componentInstance.vacationBookingStart).toBe('01.10');
    expect(fixture.componentInstance.workDays.filter(day => day.checked).map(day => day.day)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should save the current settings and show feedback', () => {
    const fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();
    const snackBarOpenSpy = spyOn((fixture.componentInstance as never as { snackBar: MatSnackBar }).snackBar, 'open');

    fixture.componentInstance.workDays.find(day => day.day === 6)!.checked = true;
    fixture.componentInstance.weekendFree = false;
    fixture.componentInstance.carryoverEnabled = true;
    fixture.componentInstance.carryoverExpiry = '15.04';
    fixture.componentInstance.vacationBookingStart = '15.11';

    fixture.componentInstance.save();

    expect(settingsServiceStub.updateSettings).toHaveBeenCalledWith({
      default_work_days: '[1,2,3,4,5,6]',
      weekend_is_free: '0',
      carryover_enabled: '1',
      carryover_expiry_date: '15.04',
      vacation_booking_start: '15.11',
    });
    expect(snackBarOpenSpy).toHaveBeenCalledWith('admin_settings.saved', 'common.ok', { duration: 3000 });
    expect(fixture.componentInstance.saving()).toBeFalse();
  });

  it('should reset saving when save fails', () => {
    settingsServiceStub.updateSettings.and.returnValue(of(void 0));

    const fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();

    settingsServiceStub.updateSettings.and.returnValue({
      subscribe: ({ error }: { error: () => void }) => error(),
    } as never);

    fixture.componentInstance.save();

    expect(fixture.componentInstance.saving()).toBeFalse();
  });
});
