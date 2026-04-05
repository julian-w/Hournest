import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { ConfigService } from '../../../core/services/config.service';
import { CreateUserDialogComponent } from './create-user-dialog.component';

describe('CreateUserDialogComponent', () => {
  let adminServiceStub: {
    createUser: jasmine.Spy;
  };
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  async function configure(isOAuthEnabled: boolean): Promise<void> {
    await TestBed.resetTestingModule();

    adminServiceStub = {
      createUser: jasmine.createSpy('createUser').and.returnValue(of({
        id: 11,
        email: 'new@example.com',
        display_name: 'New User',
        role: 'employee',
        vacation_days_per_year: 30,
        remaining_vacation_days: 30,
        holidays_exempt: false,
        weekend_worker: false,
      })),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        CreateUserDialogComponent,
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
        {
          provide: ConfigService,
          useValue: {
            isOAuthEnabled: () => isOAuthEnabled,
          },
        },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  }

  it('should require a password for local authentication', async () => {
    await configure(false);
    const fixture = TestBed.createComponent(CreateUserDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      display_name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'employee',
      vacation_days_per_year: 30,
      password: '',
    });

    expect(fixture.componentInstance.form.invalid).toBeTrue();
    expect(fixture.componentInstance.form.controls.password.hasError('required')).toBeTrue();
  });

  it('should allow creating an OAuth user without a password', async () => {
    await configure(true);
    const fixture = TestBed.createComponent(CreateUserDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      display_name: 'Grace Hopper',
      email: 'grace@example.com',
      role: 'admin',
      vacation_days_per_year: 28,
      password: '',
    });

    fixture.componentInstance.submit();

    expect(adminServiceStub.createUser).toHaveBeenCalledWith({
      display_name: 'Grace Hopper',
      email: 'grace@example.com',
      role: 'admin',
      vacation_days_per_year: 28,
    });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should generate a twelve-character password', async () => {
    await configure(false);
    const fixture = TestBed.createComponent(CreateUserDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.generatePassword();

    const password = fixture.componentInstance.form.value.password ?? '';
    expect(password.length).toBe(12);
  });

  it('should submit a local user with password and close the dialog', async () => {
    await configure(false);
    const fixture = TestBed.createComponent(CreateUserDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      display_name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'employee',
      vacation_days_per_year: 31,
      password: 'StrongPass1!',
    });

    fixture.componentInstance.submit();

    expect(adminServiceStub.createUser).toHaveBeenCalledWith({
      display_name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'employee',
      vacation_days_per_year: 31,
      password: 'StrongPass1!',
    });
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should expose backend errors and reset submitting', async () => {
    await configure(false);
    adminServiceStub.createUser.and.returnValue(throwError(() => ({
      error: { message: 'Email already exists.' },
    })));

    const fixture = TestBed.createComponent(CreateUserDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      display_name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'employee',
      vacation_days_per_year: 31,
      password: 'StrongPass1!',
    });

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error()).toBe('Email already exists.');
    expect(fixture.componentInstance.submitting()).toBeFalse();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });
});
