import { LanguageModel } from './vue-flow-form.esm';

export type Type = 'local' | 'tissueInvasion';
export type Group =
  | 'healthy'
  | 'vulnerable'
  | 'elderly'
  | 'pregnant'
  | 'cadWoman'
  | 'men'
  | 'cadMen'
  | 'children';
export type Test = 'dipslide' | 'urineSediment' | 'urineCulture';
export type Result = 'visibleHematuria' | 'proteinuria' | 'invisiableHematuria';
export type Conclusion =
  | 'ruleNotApplicable'
  | 'clinicalSuspicion'
  | 'elderlyDipslide'
  | 'negativeDipslide'
  | 'contaminatedSediment'
  | 'ambiguousCulture'
  | 'noConclusiveAbnormality'
  | 'noUrineTractInfection';
export type Choice = '0' | '1' | '2' | '3';

export type Namespace =
  | `uti.${Type}.${Group}`
  | `leukocytes.${Test}`
  | `blood.${Result}`
  | `other.${Conclusion}`;
export type Path =
  | `uti.${Type}.${Group}.${Choice}`
  | `leukocytes.${Test}.${Choice}`
  | `blood.${Result}.${Choice}`
  | `other.${Conclusion}.${Choice}`
  | '';

interface DescriptionLink {
  url: string;
  text: string;
  target: string;
}

interface QuestionModelOptions {
  label: string;
  value: string;
  selected?: boolean;
  imageSrc?: string;
  imageAlt?: string;
}

interface JumpObject {
  [key: string]: string;
}

interface JunpFunction {
  (): string | void;
}

export interface QuestionModel {
  accept?: string;
  allowOther?: boolean;
  answer?: string;
  answered?: boolean;
  className?: string;
  columns?: string[];
  content?: string;
  description?: string;
  descriptionLink?: DescriptionLink[];
  helpText?: string;
  helpTextShow?: boolean;
  html?: string;
  id: string;
  index?: number;
  inline?: boolean;
  jump?: JumpObject | JunpFunction;
  labelLeft?: string;
  labelRight?: string;
  language?: string;
  mask?: string;
  max?: string;
  maxLength?: string;
  maxSize?: string;
  model?: string;
  min?: string;
  multiple?: boolean;
  nextStepOnAnswer?: boolean;
  options?: QuestionModelOptions[];
  other?: string;
  placeholder?: string;
  required?: boolean;
  rows?: string[];
  subtitle?: string;
  tagline?: string;
  title: string;
  type: string;
}

// interface LanguageModel {
//   enterKey: string;
//   shiftKey: string;
//   ok: string;
//   continue: string;
//   skip: string;
//   pressEnter: string;
//   multipleChoiceHelpText: string;
//   multipleChoiceHelpTextSingle: string;
//   otherPrompt: string;
//   placeholder: string;
//   submitText: string;
//   longTextHelpText: string;
//   prev: string;
//   next: string;
//   percentCompleted: string;
//   invalidPrompt: string;
//   thankYouText: string;
//   successText: string;
//   ariaOk: string;
//   ariaRequired: string;
//   ariaPrev: string;
//   ariaNext: string;
//   ariaSubmitText: string;
//   ariaMultipleChoice: string;
//   ariaTypeAnswer: string;
//   errorAllowedFileTypes: string;
//   errorMaxFileSize: string;
//   errorMinFiles: string;
//   errorMaxFiles: string;
// }

export const language = new LanguageModel({
  enterKey: 'Enter',
  shiftKey: 'Shift',
  ok: 'OK',
  continue: 'Verder',
  skip: 'Overslaan',
  pressEnter: 'Druk :enterKey',
  multipleChoiceHelpText: 'Kies er 1 of meer opties',
  multipleChoiceHelpTextSingle: 'Kies 1 optie',
  otherPrompt: 'Other',
  placeholder: 'Vul hier je antwoord in...',
  submitText: 'Versturen',
  longTextHelpText: ':shiftKey + :enterKey om een nieuwe regel in te voeren.',
  prev: 'Vorige',
  next: 'Volgende',
  percentCompleted: ':percent% voltooid',
  invalidPrompt: 'Vul het wel even goed in, hè',
  thankYouText: 'Bedankt hè!',
  successText: 'Je antwoorden zijn opgeslagen.',
  ariaOk: 'Druk om verder te gaan',
  ariaRequired: 'Deze stap is verplicht',
  ariaPrev: 'Vorige stap',
  ariaNext: 'Volgende stap',
  ariaSubmitText: 'Druk om te versturen',
  ariaMultipleChoice: 'Druk :letter om te selecteren',
  ariaTypeAnswer: 'Vul in',
  errorAllowedFileTypes:
    'Ongeldig bestandstype. Toestane bestanden: :fileTypes.',
  errorMaxFileSize: 'Bestand is te groot. Toegestane grootte: :size.',
  errorMinFiles:
    'Te weinig bestanden toegevoegd. Minimaal aantal bestanden: :min.',
  errorMaxFiles:
    'Te veel bestanden toegevoegd. Maximale aantal bestanden: :max.',
});
