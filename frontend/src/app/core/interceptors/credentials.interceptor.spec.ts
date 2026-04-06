import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { credentialsInterceptor } from './credentials.interceptor';

describe('credentialsInterceptor', () => {
  it('adds withCredentials to outgoing requests', () => {
    const request = new HttpRequest('GET', '/api/user');
    const next = jasmine.createSpy('next').and.returnValue(of(new HttpResponse({ status: 200 })));

    TestBed.runInInjectionContext(() => {
      credentialsInterceptor(request, next as HttpHandlerFn).subscribe();
    });

    const forwardedRequest = next.calls.mostRecent().args[0] as HttpRequest<unknown>;

    expect(forwardedRequest).not.toBe(request);
    expect(forwardedRequest.withCredentials).toBeTrue();
    expect(request.withCredentials).toBeFalse();
  });

  it('preserves the original request payload while cloning', () => {
    const request = new HttpRequest('POST', '/api/auth/login', { username: 'demo' });
    const next = jasmine.createSpy('next').and.returnValue(of(new HttpResponse({ status: 200 })));

    TestBed.runInInjectionContext(() => {
      credentialsInterceptor(request, next as HttpHandlerFn).subscribe();
    });

    const forwardedRequest = next.calls.mostRecent().args[0] as HttpRequest<{ username: string }>;

    expect(forwardedRequest.url).toBe('/api/auth/login');
    expect(forwardedRequest.body).toEqual({ username: 'demo' });
    expect(forwardedRequest.method).toBe('POST');
    expect(forwardedRequest.withCredentials).toBeTrue();
  });
});
