export type TemplateType = 'standard' | 'compact';

export interface ExportOptions {
  template: TemplateType;
  fontFamily: string;
  nameSize: number;
  sectionHeaderSize: number;
  subHeaderSize: number;
  bodyTextSize: number;
  sectionSpacing: number; // in mm
  entrySpacing: number; // in mm (spacing between items in a list, e.g., bullets)
}

// Default export options
export const defaultExportOptions: ExportOptions = {
  template: 'standard',
  fontFamily: 'Calibri',
  nameSize: 26,
  sectionHeaderSize: 11,
  subHeaderSize: 10.5,
  bodyTextSize: 10,
  sectionSpacing: 3, // mm
  entrySpacing: 2, // mm
};