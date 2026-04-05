import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { ResetPasswordDialogComponent } from './reset-password-dialog.component';

describe('ResetPasswordDialogComponent', () => {
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  beforeEach(async () => {
    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        ResetPasswordDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefStub },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('should reject passwords shorter than eight characters', () => {
    const fixture = TestBed.createComponent(ResetPasswordDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ password: 'short' });

    expect(fixture.componentInstance.form.invalid).toBeTrue();
    expect(fixture.componentInstance.form.controls.password.hasError('minlength')).toBeTrue();
  });

  it('should not close the dialog while the form is invalid', () => {
    const fixture = TestBed.createComponent(ResetPasswordDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.submit();

    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });

  it('should close the dialog with the new password when valid', () => {
    const fixture = TestBed.createComponent(ResetPasswordDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ password: 'NewPass123!' });
    fixture.componentInstance.submit();

    expect(dialogRefStub.close).toHaveBeenCalledWith('NewPass123!');
  });
});
