import fs from 'fs';
import path from 'path';
import { fullLessonIndex } from './src/lib/academy';

const academyName = 'Polyglot Academy';
const header = [
  'Academy Name',
  'Language Code',
  'Language Name',
  'Native Name',
  'Level',
  'Lesson Number',
  'Lesson ID',
  'Lesson Title',
  'Story Status',
  'Dialogue Status',
  'Grammar Status',
  'Conjugation Status',
  'Vocabulary Count',
  'Expressions Count',
  'Arabic Meaning Status',
  'Download Path'
].join(',') + '\n';

const rows = fullLessonIndex.map(lesson => {
  // Mock download path based on lesson ID
  const downloadPath = `/downloads/${lesson.language_code}/${lesson.level}/${lesson.lesson_id}.json`;
  return [
    `"${academyName}"`,
    `"${lesson.language_code}"`,
    `"${lesson.language_name}"`,
    `"${lesson.native_name}"`,
    `"${lesson.level}"`,
    `${lesson.lesson_number}`,
    `"${lesson.lesson_id}"`,
    `"${lesson.title.replace(/"/g, '""')}"`, // Escape quotes
    `"${lesson.story_status}"`,
    `"${lesson.dialogue_status}"`,
    `"${lesson.grammar_status}"`,
    `"${lesson.conjugation_status}"`,
    `${lesson.vocabulary_count || 15}`,
    `${lesson.expressions_count || 5}`,
    `"${lesson.arabic_meaning_status}"`,
    `"${downloadPath}"`
  ].join(',');
});

fs.writeFileSync('polyglot_academy_lessons_index.csv', header + rows.join('\n'));
console.log('CSV created successfully at polyglot_academy_lessons_index.csv with ' + fullLessonIndex.length + ' rows.');
