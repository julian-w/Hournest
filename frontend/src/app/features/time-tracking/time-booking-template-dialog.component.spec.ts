import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
import { TimeBookingTemplateDialogComponent } from './time-booking-template-dialog.component';

describe('TimeBookingTemplateDialogComponent', () => {
  let dialogRefStub: {
    close: jasmine.Spy;
  };

  beforeEach(async () => {
    dialogRefStub = {
      close: jasmine.createSpy('close'),
    };

    await TestBed.configureTestingModule({
      imports: [
        TimeBookingTemplateDialogComponent,
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
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            titleKey: 'time_tracking.save_template',
            confirmKey: 'common.save',
            initialName: '  Focus Day  ',
          },
        },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
  });

  it('initializes the form value from the dialog data', () => {
    const fixture = TestBed.createComponent(TimeBookingTemplateDialogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.name).toBe('  Focus Day  ');
  });

  it('closes the dialog with the trimmed template name on submit', () => {
    const fixture = TestBed.createComponent(TimeBookingTemplateDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.name = '  Review Day  ';
    fixture.componentInstance.submit();

    expect(dialogRefStub.close).toHaveBeenCalledWith('Review Day');
  });

  it('does not close the dialog when the template name is blank', () => {
    const fixture = TestBed.createComponent(TimeBookingTemplateDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.name = '   ';
    fixture.componentInstance.submit();

    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });
});
