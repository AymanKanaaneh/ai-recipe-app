import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth';
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) { 
    this.tokenSubject.next(localStorage.getItem('token'));
  }

  register(user: { username: string, email: string, password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, user)
      .pipe(
        tap((res: any) => {
          this.storeToken(res.token.access);
        })
      );
  }

  login(credentials: { username: string, password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/`, credentials)
      .pipe(
        tap((res: any) => {
          this.storeToken(res.token.access);
        })
      );
  }

  storeToken(token: string): void {
    localStorage.setItem('token', token);
    this.tokenSubject.next(token);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
  }
}