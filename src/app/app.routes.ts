import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { InformpageComponent } from './main/informpage/informpage.component';

export const routes: Routes = [
  { path: '', redirectTo: 'main', pathMatch: 'full' },
  { path: 'main', component: MainComponent },        // <- explicit /main route
  { path: 'article/:id', component: InformpageComponent },
  { path: '**', redirectTo: 'main' }                 // <- catch-all fallback
];