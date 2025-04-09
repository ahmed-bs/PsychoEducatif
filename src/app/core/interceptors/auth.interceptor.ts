import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Get token from localStorage or sessionStorage
    const token = localStorage.getItem('token');

    // Exclude login and register endpoints
    if (req.url.includes('/login') || req.url.includes('/register')) {
      return next.handle(req);
    }

    // Clone request and add Authorization header if token exists
    const clonedRequest = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(clonedRequest);
  }
}
