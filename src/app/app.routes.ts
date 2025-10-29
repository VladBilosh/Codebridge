import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { InformpageComponent } from './main/informpage/informpage.component';

export const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'article/:id', component: InformpageComponent }
];