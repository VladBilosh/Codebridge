import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
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

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private apiService: ApikeyService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadArticles();
    }
  }

  loadArticles() {
    this.loading = true;
    this.error = '';
    
    this.apiService.getArticles(12) // Increased limit for better display
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

    return {
      ...article,
      displayDate,
      imageUrl
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

    const escapedText = this.escapeHtml(text);
    const escapedSearch = this.escapeRegex(searchTerm);
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
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