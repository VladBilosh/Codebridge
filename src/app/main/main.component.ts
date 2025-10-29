import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { TruncatePipe } from '../truncate.pipe';
import { ApikeyService } from '../apikey.service';

interface Article {
  id: string;
  title: string;
  summary: string;
  image_url?: string;
  featured: boolean;
  date?: string;
}

type ScoredArticle = Article & {
  titleMatches: number;
  descriptionMatches: number;
};

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule, TruncatePipe],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  articles: Article[] = [];
  filteredArticles: ScoredArticle[] = [];
  searchText: string = '';
  loading = false;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private sf: ApikeyService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loading = true;
    this.sf.getArticles(6)
      .pipe(finalize(() => {
        this.loading = false;
        // Ensure filteredArticles is initialized
        if (!this.filteredArticles || this.filteredArticles.length === 0) {
          this.filteredArticles = this.articles.map(a => ({ ...a, titleMatches: 0, descriptionMatches: 0 }));
        }
      }))
      .subscribe({
        next: (response: any) => {
          console.log('API response received:', response);
          
          // Extract results array from API response
          const items = response?.results || response || [];
          if (!Array.isArray(items)) {
            console.error('Expected array but got:', items);
            this.articles = [];
            this.filteredArticles = [];
            return;
          }
          
          console.log('Processing', items.length, 'articles');
          
          this.articles = items.map(i => {
            let formattedDate = '';
            if (i.published_at) {
              const date = new Date(i.published_at);
              const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
              formattedDate = date.toLocaleDateString('en-US', options);
              // Remove comma and format as "Month Day, Year"
              const parts = formattedDate.split(' ');
              formattedDate = `${parts[1]} ${parts[0]}, ${parts[2]}`;
            }
            
            return {
              id: i.id,
              title: i.title || '',
              summary: i.summary || '',
              image_url: i.image_url || '',
              featured: i.featured || false,
              date: formattedDate
            };
          });
          
          // Always initialize filteredArticles with all articles initially
          this.filteredArticles = this.articles.map(a => ({ ...a, titleMatches: 0, descriptionMatches: 0 }));
          console.log('Loaded', this.articles.length, 'articles');
        },
        error: (err: any) => {
          console.error('Failed to load articles', err);
          this.articles = [];
          this.filteredArticles = [];
        }
      });
  }

  filterArticles() {
    const raw = (this.searchText || '').trim();
    if (!raw) {
      this.filteredArticles = this.articles.map(a => ({ ...a, titleMatches: 0, descriptionMatches: 0 }));
      return;
    }

    const keywords = raw.toLowerCase().split(/\s+/).filter((k: string) => k.length > 0);

    this.filteredArticles = this.articles
      .map(article => ({
        ...article,
        titleMatches: this.countMatches(article.title, keywords),
        descriptionMatches: this.countMatches(article.summary, keywords)
      }))
      .filter(article => article.titleMatches > 0 || article.descriptionMatches > 0)
      .sort((a, b) => {
        if (a.titleMatches !== b.titleMatches) {
          return b.titleMatches - a.titleMatches;
        }
        return b.descriptionMatches - a.descriptionMatches;
      });
  }

  countMatches(text: string | undefined | null, keywords: string[]): number {
    if (!text) return 0;
    const lower = text.toLowerCase();
    return keywords.reduce((count: number, keyword: string) => count + (lower.includes(keyword) ? 1 : 0), 0);
  }

  private escapeHtml(input: string | undefined | null): string {
    if (!input) return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  highlightMatches(text: string | undefined | null): SafeHtml {
    const rawSearch = (this.searchText || '').trim();
    if (!text) return this.sanitizer.bypassSecurityTrustHtml('');
    let escaped = this.escapeHtml(text);
    if (!rawSearch) {
      return this.sanitizer.bypassSecurityTrustHtml(escaped);
    }

    const keywords = rawSearch.toLowerCase().split(/\s+/).filter((k: string) => k.length > 0);
    keywords.forEach(k => {
      const escK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escK})`, 'gi');
      escaped = escaped.replace(regex, '<span class="highlight">$1</span>');
    });

    return this.sanitizer.bypassSecurityTrustHtml(escaped);
  }

  navigateToArticle(article: Article) {
    console.log('Navigating to article:', article.id, article.title);
    // navigate by id (ensure your routes are configured)
    this.router.navigate(['/article', article.id]);
  }
}