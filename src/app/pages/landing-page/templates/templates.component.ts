import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.scss']
})
export class TemplatesComponent {

  constructor(
    private dialog: MatDialog
  ) { }

  templates = [
    {
      name: 'Modern Classic',
      badge: 'FREE',
      image: 'assets/templates/modern.png',
      description:
        'Clean ATS-friendly layout suitable for most professionals and job applications.'
    },
    {
      name: 'Executive Left Rail',
      badge: 'PRO',
      image: 'assets/templates/executive.png',
      description:
        'Premium two-column layout designed for experienced professionals and leadership roles.'
    },
    {
      name: 'Compact Grid',
      badge: 'PRO',
      image: 'assets/templates/compact.png',
      description:
        'Modern high-density layout showcasing skills, experience, and projects efficiently.'
    }
  ];

}