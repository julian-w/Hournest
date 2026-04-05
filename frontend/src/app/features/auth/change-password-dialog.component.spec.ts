import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ChangePasswordDialogComponent } from './change-password-dialog.component';

describe('ChangePasswordDialogComponent', () => {
  let authServiceStub: {
    changePassword: jasmine.Spy;
  };
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  beforeEach(async () => {
    authServiceStub = {
      changePassword: jasmine.createSpy('changePassword').and.returnValue(of(void 0)),
    };

    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        ChangePasswordDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MAT_DIALOG_DATA, useValue: { forced: true } },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should detect mismatching passwords', () => {
    const fixture = TestBed.createComponent(ChangePasswordDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      current_password: 'old-password',
      new_password: 'new-password',
      new_password_confirmation: 'different-password',
    });

    expect(fixture.componentInstance.passwordMismatch()).toBeTrue();
  });

  it('should not submit when the form is invalid', () => {
    const fixture = TestBed.createComponent(ChangePasswordDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      current_password: 'old-password',
      new_password: 'short',
      new_password_confirmation: 'short',
    });

    fixture.componentInstance.submit();

    expect(authServiceStub.changePassword).not.toHaveBeenCalled();
  });

  it('should submit matching passwords and close the dialog', () => {
    const fixture = TestBed.createComponent(ChangePasswordDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      current_password: 'old-password',
      new_password: 'new-password',
      new_password_confirmation: 'new-password',
    });

    fixture.componentInstance.submit();

    expect(authServiceStub.changePassword).toHaveBeenCalledWith(
      'old-password',
      'new-password',
      'new-password',
    );
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('should surface backend errors and reset submitting on failure', () => {
    authServiceStub.changePassword.and.returnValue(
      throwError(() => ({
        error: {
          message: 'Current password is invalid.',
        },
      })),
    );

    const fixture = TestBed.createComponent(ChangePasswordDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      current_password: 'old-password',
      new_password: 'new-password',
      new_password_confirmation: 'new-password',
    });

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error()).toBe('Current password is invalid.');
    expect(fixture.componentInstance.submitting()).toBeFalse();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });
});
