import "server-only";

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { sectionTypeLabel, type DraftParagraph } from "@/lib/proposal-types";

export type ExportSection = {
  sectionType: string;
  paragraphs: DraftParagraph[];
};

/**
 * Assembles a structured .docx file: a title heading, then one heading per
 * proposal section followed by its (edited, when present) paragraphs.
 */
export async function buildProposalDocx({
  title,
  sections,
}: {
  title: string;
  sections: ExportSection[];
}): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: title, bold: true })],
    }),
  ];

  for (const section of sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: sectionTypeLabel(section.sectionType), bold: true })],
      }),
    );

    if (section.paragraphs.length === 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "(No content drafted for this section.)", italics: true })],
        }),
      );
      continue;
    }

    for (const paragraph of section.paragraphs) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: paragraph.text })],
        }),
      );
    }
  }

  const document = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(document);
}
