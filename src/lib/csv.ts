import { LessonIndex } from './academy';

export function downloadCSV(data: LessonIndex[], filename: string) {
  if (data.length === 0) return;
  
  const headers = [
    'lesson_id', 'language_code', 'language_name', 'native_name', 'level',
    'lesson_number', 'title', 'story_status', 'dialogue_status', 'grammar_status',
    'conjugation_status', 'vocabulary_count', 'expressions_count', 'arabic_meaning_status'
  ];
  
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header as keyof LessonIndex];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
