import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export class DocumentGeneratorService {
  
  async generatePDF(content: string, filename: string): Promise<Buffer> {
    return await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(12);
      doc.text(content, {
        align: 'left',
        lineGap: 2,
      });

      doc.end();
    });
  }
  
  async generateDOCX(content: string, filename: string): Promise<Buffer> {
    // Split content into paragraphs
    const paragraphs = content.split('\n\n').map(paragraph => 
      new Paragraph({
        children: [
          new TextRun({
            text: paragraph.trim(),
            size: 24, // 12pt font (size is in half-points)
          }),
        ],
        spacing: {
          after: 200, // Spacing after paragraph
        },
      })
    );
    
    // Create Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });
    
    // Generate buffer
    return await Packer.toBuffer(doc);
  }
  
  generateTXT(content: string): Buffer {
    return Buffer.from(content, 'utf-8');
  }
}

export const documentGeneratorService = new DocumentGeneratorService();