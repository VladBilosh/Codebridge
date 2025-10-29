import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Article {
  id: number;
  title: string;
  url: string;
  image_url: string;
  news_site: string;
  summary: string;
  published_at: string;
  updated_at: string;
  featured: boolean;
  launches: any[];
  events: any[];
}

export interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Article[];
}

@Injectable({
  providedIn: 'root'
})
export class ApikeyService {
  private baseUrl = 'https://api.spaceflightnewsapi.net/v4';

  constructor(private http: HttpClient) {}

  getArticles(limit: number = 6): Observable<Article[]> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/articles/?limit=${limit}`)
      .pipe(
        map(response => {
          console.log('API Response:', response);
          return response.results || [];
        })
      );
  }

  getArticle(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.baseUrl}/articles/${id}/`);
  }

  searchArticles(search: string, limit: number = 6): Observable<Article[]> {
    const params = {
      limit: limit.toString(),
      search: search
    };
    return this.http.get<ApiResponse>(`${this.baseUrl}/articles/`, { params })
      .pipe(
        map(response => response.results || [])
      );
  }
}