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
    // Ask for most recent first; some environments were returning an empty default page
    const url = `${this.baseUrl}/articles/?limit=${limit}&ordering=-published_at`;
    return this.http.get<ApiResponse>(url)
      .pipe(
        map((response: ApiResponse) => {
          const results = Array.isArray(response?.results) ? response.results : [];
          return results.filter(Boolean);
        })
      );
  }

  getArticle(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.baseUrl}/articles/${id}/`);
  }

  searchArticles(search: string, limit: number = 6): Observable<Article[]> {
    const params = {
      limit: limit.toString(),
      search: search,
      ordering: '-published_at'
    } as any;
    return this.http.get<ApiResponse>(`${this.baseUrl}/articles/`, { params })
      .pipe(map(response => response?.results || []));
  }
}