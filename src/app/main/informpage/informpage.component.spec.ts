import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformpageComponent } from './informpage.component';

describe('InformpageComponent', () => {
  let component: InformpageComponent;
  let fixture: ComponentFixture<InformpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformpageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
