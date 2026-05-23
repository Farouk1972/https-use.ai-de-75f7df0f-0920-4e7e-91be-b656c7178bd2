export interface LessonContent {
  story: { text: string; arabic: string; english: string; };
  dialogue: Array<{ speaker: string; text: string; arabic: string; english: string; }>;
  grammar_points?: Array<{ title: string; explanation: string; arabic_explanation: string; english_explanation: string; examples: Array<{ text: string; arabic: string; english: string; }>; }>;
  conjugations?: Array<{ verb: string; arabic_meaning: string; english_meaning: string; tenses: Array<{ tense_name: string; forms: Array<string>; }>; }>;
  vocabulary: Array<{ word: string; type: string; arabic: string; english: string; ipa: string; article?: string; plural?: string; example_text: string; example_arabic: string; example_english: string; }>;
  expressions: Array<{ expression: string; arabic: string; english: string; usage_example: string; }>;
  quiz?: Array<{ question: string; options: string[]; answer_index: number; explanation: string; }>;
}

export interface LessonIndex {
  lesson_id: string;
  language_code: string;
  language_name: string;
  native_name: string;
  level: string;
  lesson_number: number;
  title: string;
  story_status: string;
  dialogue_status: string;
  grammar_status: string;
  conjugation_status: string;
  vocabulary_count: number;
  expressions_count: number;
  arabic_meaning_status: string;
  content?: LessonContent;
}

export const LANGUAGES = [
  { code: 'FR', name: 'French', native: 'Français' },
  { code: 'DE', name: 'German', native: 'Deutsch' },
  { code: 'IT', name: 'Italian', native: 'Italiano' },
  { code: 'HE', name: 'Hebrew', native: 'עברית' },
  { code: 'ES', name: 'Spanish', native: 'Español' },
  { code: 'PT', name: 'Portuguese', native: 'Português' },
  { code: 'RU', name: 'Russian', native: 'Русский' }
];

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function generateMockTitle(level: string, num: number): string {
  const curriculum: Record<string, string[]> = {
    'A1': [
      'Alphabet & Sounds', 'Basic Greetings', 'Personal Information', 'Numbers 1-100', 'Days & Months',
      'The Verb "To Be"', 'Nationalities & Countries', 'Professions', 'Colors & Adjectives', 'Basic Question Words',
      'The Verb "To Have"', 'Family Members', 'Describing Physical Appearance', 'Ages & Life Stages', 'Pets & Animals',
      'Definite vs Indefinite Articles', 'Noun Gender & Plurals', 'Demonstrative Pronouns (This/That)', 'Common Objects', 'In the Classroom',
      'Regular -AR/-ER/-IR Verbs', 'Daily Routines', 'Telling Time', 'Parts of the Day', 'Frequency Adverbs',
      'Advanced Question Words', 'Basic Negation', 'Conjunctions (And/But/Or)', 'Expressing Needs', 'Making Simple Requests',
      'Food & Groceries', 'Ordering in a Cafe', 'Quantities & Measurements', 'Numbers 100-1000', 'Expressing Hunger/Thirst',
      'Expressing Likes & Dislikes', 'Hobbies & Free Time', 'Sports & Activities', 'Music & Entertainment', 'Weekend Plans',
      'Places in the City', 'Asking for Directions', 'Transportation', 'Public Buildings', 'Rooms in a House',
      'Present Continuous Teaser', 'Weather Expressions', 'Seasons & Months', 'Clothing & Accessories', 'A1 Comprehensive Review'
    ],
    'A2': [
      'Present Tense Review', 'Irregular Verbs (Group 1)', 'Irregular Verbs (Group 2)', 'Stem-changing Verbs', 'Expressing Obligation',
      'Reflexive Verbs', 'Detailed Morning Routine', 'Body Parts', 'At the Doctor/Pharmacy', 'Symptoms & Illnesses',
      'Introduction to the Past (Perfect/Passé Composé)', 'Past Participles Regular', 'Past Participles Irregular', 'Auxiliary Verbs in the Past', 'Timeline of Yesterday',
      'Expressing Agreement & Disagreement', 'Time Markers (Ago, Since, For)', 'Biographies & Life Events', 'Historical Figures', 'Talking about Vacations',
      'Imperfect Tense Introduction', 'Describing Childhood Memories', 'Imperfect vs Perfect/Preterite', 'Interrupted Actions in the Past', 'Storytelling Basics',
      'Near Future (Going to)', 'Simple Future Tense', 'Making Predictions', 'New Years Resolutions', 'Future Plans & Ambitions',
      'Direct Object Pronouns', 'Indirect Object Pronouns', 'Double Object Pronouns', 'Giving Commands (Imperative)', 'Polite Requests',
      'Comparisons of Equality', 'Comparisons of Superiority/Inferiority', 'Superlatives', 'Adverbs of Manner', 'Describing Personality in Depth',
      'Prepositions of Place', 'Prepositions of Time', 'Describing a House Layout', 'Furniture & Appliances', 'Household Chores',
      'Technology & Gadgets', 'Internet Vocabulary', 'Writing a Formal Email', 'Phone Conversations', 'A2 Comprehensive Review'
    ],
    'B1': [
      'Modal Verbs Review & Expansion', 'Giving Advice & Recommendations', 'Expressing Prohibition', 'Permission & Rules', 'Workplace Etiquette',
      'Expressing Complex Opinions', 'Agreeing & Disagreeing Politely', 'Structuring an Argument', 'Cultural Stereotypes & Truths', 'Current Events',
      'Conditional Mood Introduction', 'Expressing Wishes & Desires', 'Hypothetical Scenarios (If clauses type 2)', 'Polite Language (Could/Would)', 'Giving Excuses',
      'Subjunctive Mood Basics', 'Subjunctive for Doubt & Uncertainty', 'Subjunctive for Emotions', 'Subjunctive for Influence & Will', 'Impersonal Expressions + Subjunctive',
      'Relative Pronouns (Who/Which/That)', 'Relative Pronouns with Prepositions', 'Combining Complex Sentences', 'Linking Words / Connectors', 'Cause & Effect Connectors',
      'Passive Voice', 'Describing Manufacturing Processes', 'Inventions & Discoveries', 'News Headlines Structure', 'Crime & Justice Vocabulary',
      'Past Perfect (Pluperfect)', 'Sequencing Multiple Past Events', 'Regrets in the Past (Should have)', 'Narrative Tenses Mix', 'Writing a Short Story',
      'Education System & Terminology', 'Job Interviews', 'Applying for a Job', 'Professional Skills', 'Workplace Conflicts',
      'Environment & Climate Change', 'Natural Disasters', 'Recycling & Sustainability', 'Wildlife Conservation', 'Alternative Energy',
      'Art & Museums', 'Reviewing Movies & Books', 'Music Genres & Instruments', 'Media & Journalism', 'B1 Comprehensive Review'
    ],
    'B2': [
      'Advanced Subjunctive Usage', 'Conjunctions Requiring Subjunctive', 'Past Subjunctive overview', 'Complex Hypothesis (Type 3)', 'Mixed Conditionals',
      'Reported Speech Basics', 'Reported Speech: Changing Tenses', 'Reporting Questions & Commands', 'Conveying Information Reliable vs Unreliable', 'Gossip & Rumors',
      'Phrasal Verbs / Compound Verbs Part 1', 'Idioms related to Body Parts', 'Idioms related to Animals', 'Idioms related to Weather', 'Understanding Native Speed Conversations',
      'Debating Controversial Topics', 'Politics & Elections', 'Economics & Finance Basics', 'Taxes & Banking', 'Global Migration',
      'Idiomatic Language in Business', 'Negotiation Vocabulary', 'Writing a Proposal', 'Delivering a Presentation', 'Marketing & Advertising',
      'Nuances of Verbs with Multiple Meanings', 'False Friends Masterclass', 'Suffixes & Prefixes', 'Word Formation (Nouns from Verbs)', 'Synonyms & Antonyms for Emphasis',
      'Participles as Adjectives', 'Verbal Noun phrases', 'Gerunds vs Infinitives', 'Prepositions after Certain Verbs', 'Prepositions after Certain Adjectives',
      'Nuanced Connectors (Although/Even though)', 'Connectors of Concession & Contrast', 'Connectors of Purpose', 'Summarizing Information', 'Paraphrasing Techniques',
      'Literature Basics: Analyzing a Text', 'Describing Abstract Concepts', 'Psychology & Mental Health', 'Philosophy & Belief systems', 'Ethics & Morality',
      'Slang and Colloquialisms', 'Formal vs Informal Register', 'Regional Accents Intro', 'Creative Writing Techniques', 'B2 Comprehensive Review'
    ],
    'C1': [
      'Extreme Nuance in Meaning', 'Irony, Sarcasm & Understatement', 'Tone of Voice & Intonation', 'Humor in Target Culture', 'Cultural References & Tropes',
      'Academic Writing Patterns', 'Crafting Strong Thesis Statements', 'Citing Sources & Bibliography', 'Critiquing Academic Papers', 'Structuring a Dissertation Element',
      'Legal Terminology', 'Courtroom Procedures', 'Intellectual Property & Copyright', 'Ethical Dilemmas in Technology', 'Corporate Governance',
      'Advanced Syntax Restructuring', 'Inversion for Emphasis', 'Cleft Sentences', 'Fronting Elements', 'Stylistic Word Order',
      'Cultural Proverbs Part 1', 'Deep Historical Idioms', 'Sayings from Literature', 'Biblical/Mythological idioms', 'Translating Cultural Concepts',
      'In-Depth Dialects & Regional Variations', 'Slang Recognition Part 2', 'Generational Slang', 'Internet / Tech Slang', 'Understanding Media Satire',
      'In-depth Philosophy Topics', 'Logic & Fallacies', 'Abstract Theory Discussion', 'Sociology & Class Dynamics', 'Gender & Identity Discourse',
      'Medical & Anatomical Jargon', 'Scientific Research Method', 'Space Exploration Vocabulary', 'Quantum Physics / Tech Basics', 'Discussing Future Technologies',
      'Analysis of Historical Texts', 'Evolving Language Use Over Time', 'Impact of Colonization on Language', 'Language Policy & Preservation', 'Bilingualism Topics',
      'Speech Giving & Oratory', 'Persuasive Rhetoric Strategies', 'Public Speaking Dynamics', 'Impromptu Speaking Challenges', 'C1 Comprehensive Review'
    ],
    'C2': [
      'Near-Native Nuances (Micro-expressions)', 'Hyper-specific Vocabulary Domains', 'Obscure Adjectives & Adverbs', 'Lexical Precision', 'Refining Pronunciation to Near-Native',
      'Translating Untranslatable Concepts', 'Cultural Subtext in Movies', 'Understanding Stand-up Comedy', 'Analyzing Satirical News', 'Cultural Taboos',
      'Wordplay & Puns', 'Linguistic Humor & Jokes', 'Creating Double Entendres', 'Riddles & Brain Teasers', 'Palindromes & Anagrams',
      'Deep Dive into Etymology', 'Greek & Latin Roots', 'Loan Words & Foreign Influences', 'Evolution of Semantics', 'Archaisms in Modern Text',
      'Poetry & Metrical Structures', 'Rhyme Schemes', 'Analyzing Classic Poems', 'Writing Target-Language Poetry', 'Song Lyrics Analysis',
      'Writing Novels: Character Development', 'Narrative Styles & Voices', 'World Building Descriptions', 'Writing Realistic Dialogue', 'Pacing & Suspense',
      'Diplomatic Negotiation Tactics', 'Conflict Resolution Language', 'De-escalation Strategies', 'High-Stakes Crisis Communication', 'Navigating Bureaucracy',
      'Advanced Critical Review', 'Critique Writing (Art/Theater)', 'Literary Criticism Frameworks', 'Restaurant / Food Criticism', 'Editorial Writing',
      'Sociolinguistics', 'Code Switching Contexts', 'Language & Power Dynamics', 'Pidgins & Creoles', 'The Future of the Language',
      'Ultimate Language Integration', 'Living & Breathing the Target Culture', 'Continuous Improvement Strategies', 'Mentoring Others', 'C2 Final Mastery Demonstration'
    ]
  };

  const levelTopics = curriculum[level] || curriculum['A1'];
  
  // For 1-100 lessons
  const segmentSize = Math.ceil(100 / levelTopics.length); 
  const topicIndex = Math.floor((num - 1) / segmentSize) % levelTopics.length;
  const topic = levelTopics[topicIndex];
  
  const subLevel = ((num - 1) % segmentSize) + 1;
  const partText = segmentSize > 1 ? ` (Part ${subLevel})` : '';

  return `Lesson ${num}: ${topic}${partText}`;
}

import { FRLessons } from './frenchLessons';

export function generateFullIndex(): LessonIndex[] {
  const index: LessonIndex[] = [];
  
  for (const lang of LANGUAGES) {
    for (const level of LEVELS) {
      for (let i = 1; i <= 100; i++) {
        const id = `${lang.code}-${level}-${i.toString().padStart(3, '0')}`;
        // Check if we have pre-generated content for this ID
        const pregenerated = FRLessons.find(l => l.lesson_id === id);
        
          let title = generateMockTitle(level, i);
          if (lang.code === 'HE' && level === 'A1') {
             if (i === 1) title = "Lesson 1: The Hebrew Alphabet (Aleph-Bet) (Part 1)";
             else if (i === 2) title = "Lesson 2: The Hebrew Alphabet (Aleph-Bet) (Part 2)";
             else if (i === 3) title = "Lesson 3: Vowels (Nikkud) & Pronunciation (Part 1)";
             else if (i === 4) title = "Lesson 4: Vowels (Nikkud) & Pronunciation (Part 2)";
             else if (i === 5) title = "Lesson 5: How to Write Hebrew Cursive (Part 1)";
             else if (i === 6) title = "Lesson 6: How to Write Hebrew Cursive (Part 2)";
             else if (i === 7) title = "Lesson 7: Reading Practice & Syllables (Part 1)";
             else if (i === 8) title = "Lesson 8: Reading Practice & Syllables (Part 2)";
             else if (i === 9) title = "Lesson 9: Basic Greetings in Hebrew (Part 1)";
             else if (i === 10) title = "Lesson 10: Basic Greetings in Hebrew (Part 2)";
          }

          if (pregenerated) {
             index.push(pregenerated as any); // Type assertion for brevity
          } else {
             index.push({
               lesson_id: id,
               language_code: lang.code,
               language_name: lang.name,
               native_name: lang.native,
               level: level,
               lesson_number: i,
               title: title,
               story_status: 'Pending',
               dialogue_status: 'Pending',
               grammar_status: 'Pending',
               conjugation_status: 'Pending',
               vocabulary_count: 20,
               expressions_count: 20,
               arabic_meaning_status: 'Pending'
             });
          }
      }
    }
  }
  
  return index;
}

// Pre-generate exactly once.
export const fullLessonIndex = generateFullIndex();
