import { TestBed } from '@angular/core/testing';

import { ApikeyService } from './apikey.service';

describe('ApikeyService', () => {
  let service: ApikeyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApikeyService]
    });
    service = TestBed.inject(ApikeyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});