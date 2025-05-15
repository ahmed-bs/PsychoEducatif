import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { AuthService } from '../services/authService.service';
import { Observable } from 'rxjs';


@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(public auth: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.url.includes('/login/') || request.url.includes('/register/')) {
      return next.handle(request); // No token added
    }
    request = request.clone({
      setHeaders: {
        Authorization: `token ${this.auth.getToken()}`
      }
    });

    return next.handle(request);
  }
}