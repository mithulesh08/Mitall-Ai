import { db } from './db';
import { DocumentChunk, KnowledgeDocument } from '../src/types/index';

export function chunkText(text: string, chunkSize: number = 600, overlap: number = 100): string[] {
  if (!text || text.trim().length === 0) return [];
  
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length <= chunkSize) {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      // If a single paragraph is longer than chunkSize, split it by sentences or characters
      if (para.length > chunkSize) {
        let i = 0;
        while (i < para.length) {
          const slice = para.substring(i, i + chunkSize);
          chunks.push(slice.trim());
          i += (chunkSize - overlap);
        }
        currentChunk = '';
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 10);
}

// Tokenize text into words, removing punctuation and lowercasing
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export interface SearchResult {
  docId: string;
  title: string;
  excerpt: string;
  score: number;
  chunkIndex: number;
}

export function searchKnowledgeBase(query: string, topK: number = 3): SearchResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const chunks = db.getDocumentChunks();
  const docs = db.getDocuments();
  const docMap = new Map<string, KnowledgeDocument>();
  for (const d of docs) {
    docMap.set(d.id, d);
  }

  const results: SearchResult[] = [];

  for (const chunk of chunks) {
    const chunkTokens = tokenize(chunk.content);
    if (chunkTokens.length === 0) continue;

    // Calculate match score using term frequency and exact keyword hits
    let score = 0;
    const chunkTokenSet = new Set(chunkTokens);

    for (const qToken of queryTokens) {
      if (chunkTokenSet.has(qToken)) {
        // Frequency boost
        const count = chunkTokens.filter((t) => t === qToken).length;
        score += 1 + Math.log(count + 1);
      }
    }

    // Exact phrase match bonus
    if (chunk.content.toLowerCase().includes(query.toLowerCase())) {
      score += 3;
    }

    if (score > 0) {
      const parentDoc = docMap.get(chunk.docId);
      results.push({
        docId: chunk.docId,
        title: parentDoc ? parentDoc.title : 'Document',
        excerpt: chunk.content,
        score,
        chunkIndex: chunk.chunkIndex,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

export function parseUploadedContent(filename: string, rawContent: string): { title: string; text: string; fileType: string } {
  const ext = filename.split('.').pop()?.toLowerCase() || 'txt';
  let cleanText = rawContent;

  // Basic cleanup
  if (ext === 'pdf') {
    // If raw content has PDF stream text or text markers, clean up null bytes and unprintable characters
    cleanText = rawContent
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/stream[\r\n]+([\s\S]*?)endstream/g, '$1')
      .replace(/\s+/g, ' ');
  }

  return {
    title: filename,
    text: cleanText,
    fileType: ext,
  };
}
