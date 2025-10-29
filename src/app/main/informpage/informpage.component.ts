import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApikeyService } from '../../apikey.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-informpage',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './informpage.component.html',
  styleUrls: ['./informpage.component.css']
})
export class InformpageComponent implements OnInit {
  article: any = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sf: ApikeyService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      console.error('No article ID found in route');
      return;
    }
    
    console.log('Loading article with ID:', id);
    
    this.sf.getArticle(id).subscribe({
      next: (a) => {
        console.log('Article data received:', a);
        
        // Format date
        let formattedDate = '';
        if (a.published_at) {
          const date = new Date(a.published_at);
          const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
          const dateStr = date.toLocaleDateString('en-US', options);
          const parts = dateStr.split(' ');
          formattedDate = `${parts[1]} ${parts[0]}, ${parts[2]}`;
        }
        
        // Map the API response to match our interface
        this.article = {
          id: a.id,
          title: a.title || '',
          summary: a.summary || '',
          image_url: a.image_url || '',
          date: formattedDate
        };
      },
      error: (err) => {
        console.error('Failed to load article:', err);
      }
    });
  }

  // reuse highlight helper if desired (or keep simple text)
  highlightHtml(text: string): SafeHtml {
    if (!text) return '';
    return this.sanitizer.bypassSecurityTrustHtml(this.escapeHtml(text));
  }

  private escapeHtml(input: string): string {
    if (!input) return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}