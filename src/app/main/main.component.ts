import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize, debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { TruncatePipe } from '../truncate.pipe';
import { ApikeyService, Article } from '../apikey.service';

interface DisplayArticle extends Article {
  displayDate: string;
  imageUrl: string;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule, TruncatePipe],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  articles: DisplayArticle[] = [];
  filteredArticles: DisplayArticle[] = [];
  searchText: string = '';
  loading = false;
  error: string = '';
  private search$ = new Subject<string>();

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private apiService: ApikeyService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadArticles();
      this.setupSearch();
    }
  }

  loadArticles() {
    this.loading = true;
    this.error = '';
    
    this.apiService.getArticles(18) // fetch a fuller first page
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (articles: Article[]) => {
          console.log('Raw articles from API:', articles);
          
          if (!articles || articles.length === 0) {
            this.error = 'No articles found.';
            this.articles = [];
            this.filteredArticles = [];
            return;
          }

          this.articles = articles.map(article => this.transformArticle(article));
          this.filteredArticles = [...this.articles];
          
          console.log('Transformed articles:', this.articles);
        },
        error: (err: any) => {
          console.error('API Error:', err);
          this.error = 'Failed to load articles. Please check your connection.';
          this.articles = [];
          this.filteredArticles = [];
        }
      });
  }

  private prioritizeAndSortArticles(articles: Article[], keywords: string): DisplayArticle[] {
    if (!keywords || !keywords.trim()) {
      return articles.map(a => this.transformArticle(a));
    }
    const terms = keywords.toLowerCase().split(/\s+/).filter(Boolean);
    const isIn = (field: string | undefined) => field ? terms.some(kw => field.toLowerCase().includes(kw)) : false;

    const toScore = (article: Article) => {
      // 2 = title match, 1 = description (summary) match, 0 = none
      if (isIn(article.title)) return 2;
      if (isIn(article.summary)) return 1;
      return 0;
    };
    const scored = articles.map(a => ({ a, score: toScore(a) }))
      .filter(obj => obj.score > 0);
    scored.sort((x, y) => y.score - x.score);
    return scored.map(x => this.transformArticle(x.a));
  }

  private setupSearch() {
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((term: string) => {
          const trimmed = (term || '').trim();
          this.loading = true;
          this.error = '';
          if (!trimmed) {
            return this.apiService.getArticles(18).pipe(catchError(() => of([])),
              // Just do direct mapping; no prioritization
              map(arts => this.prioritizeAndSortArticles(arts, ''))
            );
          }
          return this.apiService.searchArticles(trimmed, 18).pipe(catchError(() => of([])),
            map(arts => this.prioritizeAndSortArticles(arts, trimmed))
          );
        }),
        finalize(() => { this.loading = false; })
      )
      .subscribe((displayArticles: DisplayArticle[]) => {
        this.articles = displayArticles;
        this.filteredArticles = [...this.articles];
      });
  }

  onSearchChange(value: string) {
    this.searchText = value;
    this.search$.next(value);
  }

  private transformArticle(article: Article): DisplayArticle {
    // Format date
    let displayDate = '';
    if (article.published_at) {
      try {
        const date = new Date(article.published_at);
        displayDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        console.warn('Invalid date format:', article.published_at);
        displayDate = 'Recent';
      }
    } else {
      displayDate = 'Recent';
    }

    // Handle image URL
    let imageUrl = article.image_url;
    if (!imageUrl || imageUrl.includes('placeholder')) {
      // Use themed placeholder images based on content
      const placeholders = [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=200&fit=crop',
        'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=200&fit=crop',
        'https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=400&h=200&fit=crop',
        'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=200&fit=crop',
        'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=200&fit=crop',
        'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400&h=200&fit=crop'
      ];
      imageUrl = placeholders[Math.floor(Math.random() * placeholders.length)];
    }

    // Truncate summary to 100 chars for card
    let truncatedSummary = (article.summary || '').length > 100 ? article.summary.substring(0, 100) + '…' : (article.summary || '');
    return {
      ...article,
      displayDate,
      imageUrl,
      summary: truncatedSummary // override summary for card view
    };
  }

  filterArticles() {
    const searchTerm = (this.searchText || '').trim().toLowerCase();
    
    if (!searchTerm) {
      this.filteredArticles = [...this.articles];
      return;
    }

    this.filteredArticles = this.articles.filter(article => {
      const titleMatch = article.title.toLowerCase().includes(searchTerm);
      const summaryMatch = article.summary.toLowerCase().includes(searchTerm);
      const siteMatch = article.news_site.toLowerCase().includes(searchTerm);
      
      return titleMatch || summaryMatch || siteMatch;
    });
  }

  highlightMatches(text: string | undefined | null): SafeHtml {
    if (!text) {
      return this.sanitizer.bypassSecurityTrustHtml('<em>No content</em>');
    }

    const searchTerm = (this.searchText || '').trim();
    if (!searchTerm) {
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }
    // Accept multiple keywords
    const terms = searchTerm.split(/\s+/).filter(Boolean).map(this.escapeRegex);
    if (!terms.length) return this.sanitizer.bypassSecurityTrustHtml(text);
    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const escapedText = this.escapeHtml(text);
    const highlighted = escapedText.replace(regex, '<mark class="highlight">$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  navigateToArticle(article: DisplayArticle) {
    console.log('Navigating to article:', article.id);
    // Using article ID for navigation
    this.router.navigate(['/article', article.id]);
  }

  retryLoad() {
    this.loadArticles();
  }

  clearSearch() {
    this.searchText = '';
    this.filteredArticles = [...this.articles];
  }
}