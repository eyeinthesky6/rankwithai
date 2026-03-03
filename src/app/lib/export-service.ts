
'use client';

import JSZip from 'jszip';
import { Firestore, collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Service to export generated project pages as a ZIP of static HTML files.
 */
export async function exportProjectToZip(db: Firestore, project: any) {
  const zip = new JSZip();
  const pagesQuery = query(
    collection(db, 'projects', project.id, 'pages'),
    where('ownerId', '==', project.ownerId)
  );
  
  const pagesSnap = await getDocs(pagesQuery);
  const pages = pagesSnap.docs.map(d => d.data());

  if (pages.length === 0) {
    throw new Error("No pages found to export.");
  }

  // Create individual HTML files
  pages.forEach((page: any) => {
    const html = generatePageHtml(page, project);
    zip.file(`${page.slug}.html`, html);
  });

  // Add a basic index.html
  const indexHtml = generateIndexHtml(pages, project);
  zip.file('index.html', indexHtml);

  // Generate ZIP blob
  const content = await zip.generateAsync({ type: 'blob' });
  
  // Trigger download
  const url = window.URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.slug}-static-feed.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function generatePageHtml(page: any, project: any) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.seoTitle}</title>
    <meta name="description" content="${page.metaDescription}">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: #f9fafb; }
        header { margin-bottom: 60px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        h1 { font-size: 3rem; font-weight: 900; margin-bottom: 10px; color: #111; letter-spacing: -0.02em; }
        h2 { font-size: 1.8rem; margin-top: 40px; color: #111; }
        .meta { color: #666; font-size: 0.9rem; margin-bottom: 20px; }
        .content section { margin-bottom: 40px; }
        .faqs { margin-top: 80px; padding-top: 40px; border-top: 2px solid #eee; }
        .faq-item { margin-bottom: 20px; background: white; padding: 20px; rounded: 12px; border: 1px solid #eee; }
        .faq-question { font-weight: bold; margin-bottom: 10px; color: #111; }
        footer { margin-top: 100px; font-size: 0.8rem; color: #999; text-align: center; }
        nav { margin-bottom: 40px; }
        nav a { color: #443D6B; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <nav><a href="index.html">&larr; Back to Feed Index</a></nav>
    <header>
        <h1>${page.h1}</h1>
        <div class="meta">Published by ${project.name} | ${page.type}</div>
    </header>
    <div class="content">
        ${page.sections.map((s: any) => `
            <section>
                <h2>${s.h2}</h2>
                <div>${s.content}</div>
            </section>
        `).join('')}
    </div>
    ${page.faqs && page.faqs.length > 0 ? `
        <div class="faqs">
            <h3>Expert Q&A</h3>
            ${page.faqs.map((f: any) => `
                <div class="faq-item">
                    <div class="faq-question">${f.question}</div>
                    <div class="faq-answer">${f.answer}</div>
                </div>
            `).join('')}
        </div>
    ` : ''}
    <footer>
        &copy; ${new Date().getFullYear()} ${project.name} | Generated via rankwithai
    </footer>
</body>
</html>
  `;
}

function generateIndexHtml(pages: any[], project: any) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name} Content Feed</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { font-size: 2.5rem; margin-bottom: 40px; }
        ul { list-style: none; padding: 0; }
        li { margin-bottom: 15px; padding: 15px; border: 1px solid #eee; border-radius: 8px; }
        a { text-decoration: none; color: #443D6B; font-weight: bold; }
        a:hover { text-decoration: underline; }
        .type { font-size: 0.7rem; text-transform: uppercase; color: #999; margin-bottom: 5px; display: block; }
    </style>
</head>
<body>
    <h1>${project.name} Feed Index</h1>
    <ul>
        ${pages.map(p => `
            <li>
                <span class="type">${p.type}</span>
                <a href="${p.slug}.html">${p.seoTitle}</a>
            </li>
        `).join('')}
    </ul>
</body>
</html>
  `;
}
