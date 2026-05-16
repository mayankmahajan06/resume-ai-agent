import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-jd-analysis-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './jd-analysis-dialog.component.html',
  styleUrls: ['./jd-analysis-dialog.component.scss']
})
export class JdAnalysisDialogComponent {

  jobDescription = '';

  jdMatch = 0;
  hasAnalyzed = false;

  matchingSkills: string[] = [];
  missingSkills: string[] = [];
  jdSuggestions: string[] = [];

  constructor(
    private dialogRef: MatDialogRef<JdAnalysisDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) { }

  closeDialog(): void {
    this.dialogRef.close({
      jdMatch: this.jdMatch
    });
  }

  analyzeJD(): void {
    if (!this.jobDescription.trim()) {
      return;
    }

    const jdText = this.jobDescription.toLowerCase();

    /*
     Resume skills
    */
    const resumeSkills = (this.data.skills || [])
      .map((skill: string) =>
        skill.toLowerCase().trim()
      )
      .filter((skill: string) =>
        skill.length > 0
      );

    /*
     Matching skills:
     exact + partial match
    */
    this.matchingSkills = resumeSkills.filter(
      (skill: string) =>
        jdText.includes(skill) ||
        skill.split(' ').some(part =>
          part.length > 3 &&
          jdText.includes(part)
        )
    );

    /*
     Dynamic JD keyword extraction
    */
    const stopWords = [
      'and', 'or', 'with', 'for', 'the',
      'a', 'an', 'to', 'in', 'of', 'on',
      'is', 'are', 'must', 'required',
      'good', 'strong', 'experience',
      'knowledge', 'understanding',
      'ability', 'candidate', 'should',
      'have', 'working', 'using',
      'looking', 'developer'
    ];

    const jdWords = jdText
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word =>
        word.length > 3 &&
        !stopWords.includes(word)
      );

    /*
     Word frequency
     repeated words = important
    */
    const wordFrequency: any = {};

    jdWords.forEach(word => {
      wordFrequency[word] =
        (wordFrequency[word] || 0) + 1;
    });

    /*
     Important JD keywords
     based on repetition
    */
    const importantJDWords = Object.keys(wordFrequency)
      .filter(word =>
        wordFrequency[word] >= 1
      )
      .slice(0, 10);

    /*
     Missing skills
    */
    this.missingSkills = importantJDWords.filter(
      word =>
        !resumeSkills.some((skill: any) =>
          skill.includes(word)
        )
    ).slice(0, 5);

    /*
     Score calculation
    */
    const matchedCount =
      this.matchingSkills.length;

    const totalExpected =
      matchedCount +
      this.missingSkills.length || 1;

    let skillScore = Math.round(
      (matchedCount / totalExpected) * 70
    );

    /*
     Resume quality bonus
    */
    let bonus = 0;

    if (
      this.data.summary &&
      this.data.summary.trim().length >= 80
    ) {
      bonus += 10;
    }

    if (
      this.data.experiences &&
      this.data.experiences.length >= 1
    ) {
      bonus += 10;
    }

    if (
      this.data.certifications &&
      this.data.certifications.length >= 1
    ) {
      bonus += 5;
    }

    /*
     Final free-tier cap
    */
    this.jdMatch = Math.max(
      35,
      Math.min(skillScore + bonus, 85)
    );

    /*
     Suggestions
    */
    this.jdSuggestions = [];

    if (this.missingSkills.length > 0) {
      this.jdSuggestions.push(
        `Consider adding: ${this.missingSkills.join(', ')}`
      );
    }

    if (bonus < 20) {
      this.jdSuggestions.push(
        'Improve summary and work experience sections'
      );
    }
    this.hasAnalyzed = true;
  }

}