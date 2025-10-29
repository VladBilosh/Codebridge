import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApikeyService {
  private base = 'https://api.spaceflightnewsapi.net/v4';

  constructor(private http: HttpClient) {}

  getArticles(limit = 6): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/articles?_limit=${limit}`);
  }

  getArticle(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/articles/${id}`);
  }
}