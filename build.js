// build.js - Zero-Dependency Markdown Compiler, SEO/AEO/VEO Engine & Database Generator for TRAEC
const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'content');
const outputDir = path.join(__dirname, 'articles');
const dataJsPath = path.join(__dirname, 'data.js');
const sitemapPath = path.join(__dirname, 'sitemap.xml');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Configuration: Temporarily withhold images while upgrading artwork via MinekSuite MCP
const SUPPRESS_IMAGES = true;

// ==========================================
// AFFILIATE INTEGRATIONS & LEAD ENGINE
// ==========================================
// Networx Affiliate ID (provided by rep Josh upon onboarding)
// Example format from PickHVAC partner: aff_id=471684d6c43cfc529b30d600113dae63
const NETWORX_AFF_ID = null; // Staged: set to live partner ID when received

// Category-specific Networx form IDs (or universal default)
const NETWORX_TRADE_MAP = {
  'roofing': 2215,
  'hvac': 2215,
  'water-barriers': 2215,
  'air-barriers': 2215,
  'efficient-systems': 2215,
  'envelopes': 2215,
  'urban-development': 2215,
  'rural-development': 2215,
  'go-green': 2215,
  'default': 2215
};

function renderContractorCTA(frontmatter, citiesStr) {
  if (NETWORX_AFF_ID) {
    const formId = NETWORX_TRADE_MAP[frontmatter.catSlug] || NETWORX_TRADE_MAP['default'];
    return `
    <!-- Networx Dynamic Live Quote Form Embed -->
    <div class="mt-14 p-6 sm:p-8 rounded-2xl bg-white border-2 border-steel-border shadow-sm">
      <div class="flex items-center justify-between gap-2 mb-2">
        <span class="text-xs font-mono uppercase tracking-widest text-crimson font-bold">Vetted Local Estimates</span>
        <span class="text-[10px] font-mono text-slate-400">Midwest Region (Climate Zone 1 Very Hot-Humid & Island Climates)</span>
      </div>
      <h3 class="text-2xl font-bold text-navy font-serif">
        Compare Free Local Quotes in Your Area
      </h3>
      <p class="text-slate-600 text-sm mt-2 font-sans leading-relaxed mb-6">
        Connect with licensed, building-science trained contractors serving ${citiesStr}. No obligation, free project estimates.
      </p>
      <div class="networx-embed-container min-h-[300px]">
        <script type="text/javascript" src="https://api.networx.com/iframe.php?aff_id=${NETWORX_AFF_ID}&aff_to_form_id=${formId}"></script>
      </div>
    </div>`;
  }

  // Fallback CTA when waiting for partner credentials
  return `
    <!-- Natural Dual CTA 2: Contractor Matching Hook -->
    <div class="mt-14 p-8 rounded-2xl bg-white border-2 border-steel-border shadow-sm">
      <div class="flex items-center justify-between gap-2 mb-2">
        <span class="text-xs font-mono uppercase tracking-widest text-crimson font-bold">Vetted Contractor Network</span>
        <span class="text-[10px] font-mono text-slate-400">Midwest Region</span>
      </div>
      <h3 class="text-2xl font-bold text-navy font-serif">
        Need Vetted Local Specialists in Your Area?
      </h3>
      <p class="text-slate-600 text-sm mt-2 font-sans leading-relaxed">
        Connect with licensed, building-science trained contractors serving ${citiesStr}. Free estimates with zero obligation.
      </p>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <a href="../browse.html?cat=${frontmatter.catSlug}" class="px-5 py-2.5 rounded-xl bg-crimson hover:bg-crimson-hover text-white text-xs font-mono font-semibold transition shadow-sm">
          Get Local Contractor Quotes &rarr;
        </a>
        <a href="../browse.html?cat=all" class="px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-medium transition">
          Browse More Specifications
        </a>
      </div>
    </div>`;
}

const imageMap = {
  'ice-dams-roofs': 'ice-dam-dynamics-diagram.jpg',
  'attic-air-sealing-baffles': 'ice-dam-dynamics-diagram.jpg',
  'balloon-framing': 'balloon-framing-sealed.jpg',
  'balloon-framing-retrofit-steps': 'balloon-framing-sealed.jpg',
  'insulating-brick': 'insulating-brick-diagram.jpg',
  'historic-brick-retrofit-steps': 'insulating-brick-diagram.jpg',
  'crawlspace-encapsulation': 'basement-waterproofing-diagram.jpg',
  'crawlspace-encapsulation-steps': 'basement-waterproofing-diagram.jpg',
  'basement-waterproofing': 'basement-waterproofing-diagram.jpg',
  'barndominium-post-frame': 'barndominium-post-frame-diagram.jpg',
  'cold-climate-heat-pumps': 'cold-climate-heat-pump-diagram.jpg',
  'continuous-insulation': 'continuous-insulation-diagram.jpg',
  'rockwool-vs-fiberglass': 'rockwool-vs-fiberglass-diagram.jpg',
  'sips-vs-traditional-framing': 'sips-framing-diagram.jpg',
  'icf-basements-walls': 'icf-basement-diagram.jpg',
  'energy-hikes': 'stack-effect-diagram.jpg'
};

// Simple YAML frontmatter parser
function parseFrontmatter(fileContent) {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: fileContent };
  }

  const rawYaml = match[1];
  const body = match[2];
  const frontmatter = {};

  rawYaml.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();

      // Clean quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      // Array parser (e.g. ["A", "B"])
      if (val.startsWith('[') && val.endsWith(']')) {
        try {
          val = JSON.parse(val);
        } catch (e) {
          val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        }
      }
      frontmatter[key] = val;
    }
  });

  return { frontmatter, body };
}

// Extract HowTo steps for JSON-LD schema
function extractHowToSteps(bodyMd) {
  const steps = [];
  const lines = bodyMd.split('\n');
  let currentStep = null;

  for (const line of lines) {
    const stepMatch = line.trim().match(/^###\s+Step\s+(\d+):\s+(.*)$/i);
    if (stepMatch) {
      if (currentStep) steps.push(currentStep);
      currentStep = {
        "@type": "HowToStep",
        "position": parseInt(stepMatch[1], 10),
        "name": stepMatch[2].trim(),
        "text": ""
      };
      continue;
    }
    if (currentStep) {
      if (line.trim().startsWith('---') || (line.trim().startsWith('## ') && !line.trim().startsWith('### '))) {
        steps.push(currentStep);
        currentStep = null;
      } else if (line.trim()) {
        const clean = line.replace(/^[\*\-\d\.]+\s+/, '').replace(/[\*\_\[\]]/g, '').trim();
        if (clean) {
          currentStep.text += (currentStep.text ? ' ' : '') + clean;
        }
      }
    }
  }
  if (currentStep) steps.push(currentStep);
  return steps;
}

// Lightweight Markdown to HTML parser
function markdownToHtml(md) {
  let html = '';
  const lines = md.split('\n');
  let inList = false;
  let inTable = false;
  let tableHeaderDone = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Carousel parsing (:::carousel ... :::)
    if (line.startsWith(':::carousel')) {
      let carouselLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        carouselLines.push(lines[i]);
        i++;
      }

      if (SUPPRESS_IMAGES) {
        html += `<!-- [Technical Diagram Carousel withheld for MinekSuite architectural rendering] -->\n`;
        continue;
      }

      const carouselId = 'carousel-' + Math.random().toString(36).substring(2, 8);
      let slides = [];
      let currentSlide = { title: 'Slide 1', img: '', alt: '', caption: '' };

      for (let c = 0; c < carouselLines.length; c++) {
        let cLine = carouselLines[c].trim();
        if (!cLine) continue;

        if (cLine.startsWith('### ')) {
          if (currentSlide.img) {
            slides.push(currentSlide);
          }
          currentSlide = { title: cLine.slice(4).trim(), img: '', alt: '', caption: '' };
          continue;
        }

        if (cLine.startsWith('<!-- slide -->')) {
          if (currentSlide.img) {
            slides.push(currentSlide);
          }
          currentSlide = { title: `Archetype ${slides.length + 1}`, img: '', alt: '', caption: '' };
          continue;
        }

        let imgMatch = cLine.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          currentSlide.alt = imgMatch[1];
          let src = imgMatch[2];
          if (src.startsWith('images/')) src = '../' + src;
          currentSlide.img = src;
          continue;
        }

        if (cLine.startsWith('Figure') || cLine.startsWith('*Figure')) {
          currentSlide.caption = cLine.replace(/^\*|\*$/g, '');
          continue;
        }
      }
      if (currentSlide.img) {
        slides.push(currentSlide);
      }

      // Build Carousel HTML
      let cHtml = `<div class="my-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm" data-carousel="${carouselId}">\n`;
      cHtml += `  <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-2">\n`;
      cHtml += `    <span class="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Interactive Archetype Comparison</span>\n`;
      cHtml += `    <div class="flex items-center gap-1.5">\n`;
      slides.forEach((s, idx) => {
        const activeClass = idx === 0 ? 'bg-navy text-white shadow-xs' : 'text-slate-600 hover:text-navy hover:bg-slate-200/60';
        cHtml += `      <button onclick="switchSlide('${carouselId}', ${idx})" class="carousel-tab px-3 py-1 rounded-full text-xs font-mono font-medium transition ${activeClass}">${s.title}</button>\n`;
      });
      cHtml += `    </div>\n  </div>\n`;

      slides.forEach((s, idx) => {
        const hiddenClass = idx === 0 ? 'block' : 'hidden';
        cHtml += `  <div class="carousel-slide ${hiddenClass}">\n`;
        cHtml += `    <div class="overflow-hidden rounded-xl border border-slate-100 bg-[#FBFBFC]">\n`;
        cHtml += `      <img src="${s.img}" alt="${s.alt}" class="w-full h-auto object-contain max-h-[500px] mx-auto block" loading="lazy" />\n`;
        cHtml += `    </div>\n`;
        if (s.caption) {
          cHtml += `    <p class="text-xs font-mono text-slate-500 mt-3 text-center italic">${s.caption}</p>\n`;
        }
        cHtml += `  </div>\n`;
      });

      cHtml += `</div>\n`;
      html += cHtml;
      continue;
    }

    // Standalone Image: ![Alt](images/...)
    let standaloneImgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (standaloneImgMatch) {
      let alt = standaloneImgMatch[1];
      if (SUPPRESS_IMAGES) {
        html += `<!-- [Technical Diagram Figure withheld for MinekSuite architectural rendering: ${alt}] -->\n`;
        continue;
      }
      let src = standaloneImgMatch[2];
      if (src.startsWith('images/')) src = '../' + src;
      html += `<figure class="my-8 rounded-2xl overflow-hidden border border-slate-200 bg-white p-2 sm:p-4 shadow-sm">\n`;
      html += `  <img src="${src}" alt="${alt}" class="w-full h-auto rounded-xl object-contain max-h-[550px] mx-auto block" loading="lazy" />\n`;
      if (alt) {
        html += `  <figcaption class="text-xs font-mono text-slate-500 mt-2.5 text-center italic">${alt}</figcaption>\n`;
      }
      html += `</figure>\n`;
      continue;
    }

    // Table parsing
    if (line.startsWith('|')) {
      if (!inTable) {
        html += '<div class="my-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">\n<table class="w-full text-left border-collapse text-sm">\n';
        inTable = true;
        tableHeaderDone = false;
      }

      // Check if separator line (|---|---|)
      if (/^\|[\s\-:]+\|/.test(line)) {
        tableHeaderDone = true;
        continue;
      }

      const cells = line.split('|').slice(1, -1).map(c => c.trim());

      if (!tableHeaderDone) {
        html += '<thead class="bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase text-navy font-bold">\n<tr>\n';
        cells.forEach(cell => {
          html += `  <th class="px-4 py-3">${formatInline(cell)}</th>\n`;
        });
        html += '</tr>\n</thead>\n<tbody class="divide-y divide-slate-100 font-sans">\n';
      } else {
        html += '<tr class="hover:bg-slate-50/60 transition">\n';
        cells.forEach((cell, idx) => {
          const isBold = idx === 0 ? 'font-semibold text-slate-900' : 'text-slate-600';
          html += `  <td class="px-4 py-3 ${isBold}">${formatInline(cell)}</td>\n`;
        });
        html += '</tr>\n';
      }
      continue;
    } else if (inTable) {
      html += '</tbody></table></div>\n';
      inTable = false;
      tableHeaderDone = false;
    }

    // Blockquote & Quick Summary Box
    if (line.startsWith('> ')) {
      let bqLines = [];
      while (i < lines.length && (lines[i].trim().startsWith('>') || lines[i].trim() === '')) {
        let cleaned = lines[i].trim().replace(/^>\s?/, '');
        bqLines.push(cleaned);
        i++;
      }
      i--; // rewind one step for main loop

      const isQuickSummary = bqLines.some(l => /^\*\*(?:Quick Summary|Executive Summary):?\*\*/i.test(l.trim()));

      if (isQuickSummary) {
        let bqHtml = '<section id="quick-summary" class="quick-summary-box my-8 p-6 sm:p-7 rounded-2xl bg-emerald-50/50 border-l-4 border-emerald-600 border border-emerald-200/60 shadow-sm">\n';
        bqHtml += '  <div class="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 mb-2">\n';
        bqHtml += '    Quick Summary\n';
        bqHtml += '  </div>\n';

        let inBqList = false;
        for (let b = 0; b < bqLines.length; b++) {
          let bLine = bqLines[b].trim();
          if (!bLine) continue;

          if (bLine.startsWith('- ') || bLine.startsWith('* ')) {
            if (!inBqList) {
              bqHtml += '  <ul class="quick-summary-bullets mt-4 pt-4 border-t border-emerald-200/80 space-y-2.5 text-sm text-slate-700 font-sans">\n';
              inBqList = true;
            }
            bqHtml += `    <li class="flex items-start gap-2.5"><span class="w-4 h-4 rounded-full bg-crimson text-white flex items-center justify-center shrink-0 mt-0.5"><svg class="w-2.5 h-2.5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></span><span>${formatInline(bLine.slice(2).trim())}</span></li>\n`;
          } else {
            if (inBqList) {
              bqHtml += '  </ul>\n';
              inBqList = false;
            }
            let cleanText = bLine.replace(/^\*\*(?:Quick Summary|Executive Summary):?\*\*\s*/i, '');
            if (cleanText.trim()) {
              bqHtml += `  <p class="quick-summary-text text-slate-800 text-base sm:text-lg font-serif leading-relaxed my-2">${formatInline(cleanText)}</p>\n`;
            }
          }
        }
        if (inBqList) bqHtml += '  </ul>\n';
        bqHtml += '</section>\n';
        html += bqHtml;
        continue;
      } else {
        // Standard editorial callout card
        let calloutHtml = '<div class="my-6 p-5 sm:p-6 rounded-xl bg-slate-50 border-l-4 border-slate-400 border border-slate-200 text-slate-700 font-sans shadow-xs">\n';
        for (let b = 0; b < bqLines.length; b++) {
          let bLine = bqLines[b].trim();
          if (!bLine) continue;
          if (bLine.startsWith('### ')) {
            calloutHtml += `  <h4 class="text-base font-bold text-navy font-serif mb-2">${formatInline(bLine.slice(4))}</h4>\n`;
          } else if (bLine.startsWith('- ') || bLine.startsWith('* ')) {
            calloutHtml += `  <div class="flex items-start gap-2 text-sm text-slate-700 my-1"><span class="text-crimson font-bold">&bull;</span><span>${formatInline(bLine.slice(2).trim())}</span></div>\n`;
          } else {
            calloutHtml += `  <p class="text-sm sm:text-base leading-relaxed my-1.5">${formatInline(bLine)}</p>\n`;
          }
        }
        calloutHtml += '</div>\n';
        html += calloutHtml;
        continue;
      }
    }

    // List parsing
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        html += '<ul class="list-disc pl-6 space-y-2 text-slate-700 my-4">\n';
        inList = true;
      }
      const itemContent = line.slice(2).trim();
      html += `  <li>${formatInline(itemContent)}</li>\n`;
      continue;
    } else if (inList) {
      html += '</ul>\n';
      inList = false;
    }

    // Numbered List parsing (e.g. "1. ")
    if (/^\d+\.\s/.test(line)) {
      const itemContent = line.replace(/^\d+\.\s/, '').trim();
      html += `<div class="flex items-start gap-3 my-3 text-slate-700 text-base leading-relaxed pl-1"><span class="w-6 h-6 rounded-full bg-navy/10 text-navy font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">${line.match(/^\d+/)[0]}</span><div>${formatInline(itemContent)}</div></div>\n`;
      continue;
    }

    // Horizontal Rule
    if (line === '---') {
      html += '<hr class="my-8 border-slate-200" />\n';
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      html += `<h3 class="text-xl font-bold text-navy font-serif mt-8 mb-3">${formatInline(line.slice(4))}</h3>\n`;
      continue;
    }
    if (line.startsWith('## ')) {
      html += `<h2 class="text-2xl font-bold text-navy font-serif mt-10 mb-4 pt-4 border-t border-slate-100">${formatInline(line.slice(3))}</h2>\n`;
      continue;
    }
    if (line.startsWith('# ')) {
      // Main H1 skipped in body if placed in template header
      continue;
    }

    // Empty lines
    if (line === '') {
      continue;
    }

    // Standard Paragraph (Tight 2-3 sentences)
    html += `<p class="text-slate-700 text-base leading-relaxed my-4">${formatInline(line)}</p>\n`;
  }

  if (inList) html += '</ul>\n';
  if (inTable) html += '</tbody></table></div>\n';

  return html;
}

function formatInline(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-navy font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, href) => {
      let finalHref = href;
      if (finalHref.startsWith('articles/')) {
        finalHref = finalHref.replace(/^articles\//, '');
      }
      return `<a href="${finalHref}" class="text-crimson font-medium underline hover:text-crimson-hover">${text}</a>`;
    });
}

// Generate complete HTML page with Enterprise-Grade SEO, AEO, and VEO Architecture
function buildArticleHtml(frontmatter, htmlBody, bodyMd) {
  const slug = frontmatter.slug || 'article';
  const citiesStr = Array.isArray(frontmatter.cities) ? frontmatter.cities.slice(0, 5).join(', ') + '...' : frontmatter.cities || 'Midwest';
  const statesStr = Array.isArray(frontmatter.states) ? frontmatter.states.join(', ') : frontmatter.states || 'All Midwest';
  const formatBadge = frontmatter.format ? frontmatter.format.toUpperCase() : 'FEATURE';
  const leadTag = frontmatter.leadType ? ` &bull; ${frontmatter.leadType.toUpperCase()} LEAD` : '';

  const siteUrl = 'https://tropicalaec.com';
  const canonicalUrl = `${siteUrl}/articles/${slug}.html`;
  const cleanSummary = (frontmatter.summary || frontmatter.subtitle || '').replace(/"/g, '&quot;');
  
  const imageName = imageMap[slug] || 'stack-effect-diagram.jpg';
  const imageUrl = `${siteUrl}/images/${imageName}`;

  // Build JSON-LD structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `${siteUrl}/index.html`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": frontmatter.category || "Building Science",
        "item": `${siteUrl}/browse.html?cat=${frontmatter.catSlug || 'all'}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": frontmatter.title,
        "item": canonicalUrl
      }
    ]
  };

  let mainSchema = {};

  if (frontmatter.format === 'Tutorial') {
    const steps = extractHowToSteps(bodyMd);
    mainSchema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": frontmatter.title,
      "description": frontmatter.summary || frontmatter.subtitle,
      "estimatedCost": {
        "@type": "MonetaryAmount",
        "currency": "USD"
      },
      "step": steps.length > 0 ? steps : undefined
    };
    if (!SUPPRESS_IMAGES) {
      mainSchema.image = {
        "@type": "ImageObject",
        "url": imageUrl
      };
    }
  } else {
    // Feature or Report or Listicle
    mainSchema = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": frontmatter.title,
      "alternativeHeadline": frontmatter.subtitle,
      "description": frontmatter.summary || frontmatter.subtitle,
      "inLanguage": "en-US",
      "proficiencyLevel": "Expert",
      "genre": frontmatter.format || "Building Science Analysis",
      "keywords": `${frontmatter.category}, Building Science, Climate Zone 5, Midwest Architecture, ${frontmatter.codeTag || ''}`,
      "author": {
        "@type": "Organization",
        "name": frontmatter.author || "Tropical AEC Building Science",
        "url": siteUrl
      },
      "publisher": {
        "@type": "Organization",
        "name": "Midwest Architecture, Engineering & Construction",
        "url": siteUrl
      },
      "datePublished": "2026-10-01T08:00:00Z",
      "dateModified": "2026-10-19T18:00:00Z",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".quick-summary-text", ".quick-summary-bullets"]
      },
      "about": [
        {
          "@type": "Thing",
          "name": frontmatter.category
        },
        {
          "@type": "Thing",
          "name": "Building Science & Envelope Thermodynamics"
        }
      ]
    };
    if (!SUPPRESS_IMAGES) {
      mainSchema.image = imageUrl;
      mainSchema.publisher.logo = {
        "@type": "ImageObject",
        "url": `${siteUrl}/images/stack-effect-diagram.jpg`
      };
    }
  }

  const imageMetaTags = SUPPRESS_IMAGES ? `  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${frontmatter.title}">
  <meta name="twitter:description" content="${cleanSummary}">` : `  <!-- Open Graph / Facebook -->
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="675">
  <meta property="og:image:alt" content="${frontmatter.title} Technical Diagram">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${frontmatter.title}">
  <meta name="twitter:description" content="${cleanSummary}">
  <meta name="twitter:image" content="${imageUrl}">`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary SEO Tags -->
  <title>${frontmatter.title} | Tropical AEC</title>
  <meta name="description" content="${cleanSummary}">
  <meta name="keywords" content="${frontmatter.category}, Midwest building science, Climate Zone 5, ${frontmatter.codeTag || ''}, residential construction, thermal boundary, energy efficiency">
  <link rel="canonical" href="${canonicalUrl}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Tropical AEC Building Science">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${frontmatter.title}">
  <meta property="og:description" content="${cleanSummary}">
  <meta property="article:published_time" content="2026-10-01T08:00:00Z">
  <meta property="article:modified_time" content="2026-10-19T18:00:00Z">
  <meta property="article:section" content="${frontmatter.category}">
  <meta property="article:author" content="${frontmatter.author || 'Tropical AEC Building Science'}">

${imageMetaTags}

  <!-- AEO / VEO JSON-LD Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(breadcrumbSchema, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(mainSchema, null, 2)}
  </script>

  <!-- Typography & Styling -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            serif: ['"Newsreader"', 'Georgia', 'serif'],
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            navy: {
              DEFAULT: '#161F83',
              dark: '#0e1458',
              deep: '#0a0e3f',
              text: '#111863',
              50: '#eef2ff',
            },
            steel: {
              DEFAULT: '#3274AE',
              dark: '#225582',
              100: '#e8f2fa',
              50: '#f4f8fc',
              border: '#d0e1f0',
            },
            crimson: {
              DEFAULT: '#C42927',
              hover: '#a8211f',
              light: '#fdf2f2',
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-[#FBFBFC] text-slate-800 font-sans antialiased selection:bg-navy selection:text-white min-h-screen flex flex-col">

  <!-- Header -->
  <header class="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <a href="../index.html" class="flex items-center gap-2 group">
        <div class="w-8 h-8 rounded-lg bg-navy flex items-center justify-center font-bold text-white text-xs font-mono group-hover:bg-navy-dark transition">
          <span>T</span><span class="text-crimson">R</span>
        </div>
        <span class="text-lg font-bold tracking-tight text-navy font-serif">Tropical<span class="text-steel">AEC</span><span class="text-[9px] font-sans text-slate-400 font-normal align-top ml-0.5">™</span></span>
      </a>

      <div class="flex items-center gap-4 text-xs font-mono uppercase">
        <a href="../browse.html?cat=${frontmatter.catSlug}" class="text-steel hover:text-navy transition font-semibold">&larr; ${frontmatter.category}</a>
        <span class="text-slate-300">|</span>
        <a href="../browse.html?cat=all" class="text-slate-500 hover:text-navy transition">All Guides</a>
      </div>
    </div>
  </header>

  <!-- Focused Single-Column Monograph -->
  <main class="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full" itemscope itemtype="https://schema.org/TechArticle">
    <!-- Format Badge, Category & Metadata -->
    <div class="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 mb-4">
      <span class="px-2.5 py-0.5 rounded-full bg-navy text-white font-bold tracking-wider uppercase text-[10px]">
        ${formatBadge}${leadTag}
      </span>
      <span class="px-2.5 py-0.5 rounded bg-steel-50 text-steel-dark border border-steel-border font-semibold">
        ${frontmatter.category}
      </span>
      <span>&bull;</span>
      <span class="text-slate-600">States: ${statesStr}</span>
      <span>&bull;</span>
      <span class="text-crimson font-medium">${frontmatter.readTime || '8 min read'}</span>
    </div>

    <!-- Article Title -->
    <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy font-serif tracking-tight leading-tight mb-3" itemprop="headline">
      ${frontmatter.title}
    </h1>

    ${frontmatter.subtitle ? `
    <!-- Description Subtitle -->
    <p class="text-lg sm:text-xl text-slate-600 font-serif leading-relaxed mb-6 font-normal" itemprop="description">
      ${frontmatter.subtitle}
    </p>` : ''}

    <div class="flex items-center gap-3 text-xs font-mono text-slate-500 border-b border-slate-200 pb-6 mb-8">
      <span>By <span itemprop="author">${frontmatter.author || 'Tropical AEC Building Science'}</span></span>
      <span>&bull;</span>
      <span>Published <time datetime="2026-10-01">${frontmatter.date || 'October 2026'}</time></span>
      <span>&bull;</span>
      <span class="text-steel font-bold">${frontmatter.codeTag || 'Building Science Spec'}</span>
    </div>

    <!-- Article Content -->
    <article class="prose max-w-none" itemprop="articleBody">
      ${htmlBody}
    </article>

    <!-- Contractor Referral / Lead-Gen Hook -->
    ${renderContractorCTA(frontmatter, citiesStr)}
  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-200 bg-white py-8 text-xs text-slate-500 font-mono mt-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3 flex-wrap">
        <a href="../about.html" class="hover:text-navy">About</a>
        <span>&bull;</span>
        <a href="../privacy.html" class="hover:text-navy">Privacy Policy</a>
        <span>&bull;</span>
        <a href="../terms.html" class="hover:text-navy">Terms of Service</a>
        <span>&bull;</span>
        <a href="../disclosure.html" class="hover:text-navy">Affiliate Disclosure</a>
      </div>
      <div>&copy; 2026 Tropical AEC™ &bull; Independent Building Science Publication. All rights reserved.</div>
    </div>
  </footer>
  <script>
    function switchSlide(carouselId, index) {
      const container = document.querySelector('[data-carousel="' + carouselId + '"]');
      if (!container) return;
      const tabs = container.querySelectorAll('.carousel-tab');
      const slides = container.querySelectorAll('.carousel-slide');
      tabs.forEach((tab, i) => {
        if (i === index) {
          tab.className = 'carousel-tab px-3 py-1 rounded-full text-xs font-mono font-semibold transition bg-navy text-white shadow-xs';
        } else {
          tab.className = 'carousel-tab px-3 py-1 rounded-full text-xs font-mono font-medium transition text-slate-600 hover:text-navy hover:bg-slate-200/60';
        }
      });
      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.remove('hidden');
          slide.classList.add('block');
        } else {
          slide.classList.add('hidden');
          slide.classList.remove('block');
        }
      });
    }
  </script>
</body>
</html>
`;
}

// Compile all articles & generate data.js + sitemap.xml
function build() {
  console.log('Building TRAEC articles with Enterprise SEO, AEO & VEO metadata...');
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
  const databaseRecords = [];
  const sitemapUrls = [
    { loc: 'https://tropicalaec.com/index.html', priority: '1.0', changefreq: 'weekly' },
    { loc: 'https://tropicalaec.com/browse.html', priority: '0.9', changefreq: 'weekly' },
    { loc: 'https://tropicalaec.com/about.html', priority: '0.8', changefreq: 'monthly' },
    { loc: 'https://tropicalaec.com/privacy.html', priority: '0.5', changefreq: 'yearly' },
    { loc: 'https://tropicalaec.com/terms.html', priority: '0.5', changefreq: 'yearly' },
    { loc: 'https://tropicalaec.com/disclosure.html', priority: '0.6', changefreq: 'yearly' }
  ];

  files.forEach(file => {
    const fullPath = path.join(contentDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);

    const slug = frontmatter.slug || path.basename(file, '.md');
    const htmlBody = markdownToHtml(body);
    const fullHtml = buildArticleHtml(frontmatter, htmlBody, body);

    const outPath = path.join(outputDir, `${slug}.html`);
    fs.writeFileSync(outPath, fullHtml, 'utf8');
    console.log(`✓ Built articles/${slug}.html (SEO/AEO/VEO Enhanced)`);

    databaseRecords.push({
      title: frontmatter.title,
      subtitle: frontmatter.subtitle || '',
      format: frontmatter.format || 'Feature',
      leadType: frontmatter.leadType || '',
      category: frontmatter.category,
      catSlug: frontmatter.catSlug,
      cities: frontmatter.cities || ["All Midwest"],
      states: frontmatter.states || ["All Midwest"],
      summary: frontmatter.summary || '',
      codeTag: frontmatter.codeTag || "Building Science Spec",
      type: frontmatter.format || "Article",
      url: `articles/${slug}.html`
    });

    sitemapUrls.push({
      loc: `https://tropicalaec.com/articles/${slug}.html`,
      priority: frontmatter.format === 'Feature' ? '0.9' : '0.8',
      changefreq: 'monthly'
    });
  });

  // Write updated data.js
  const dataJsContent = `// Auto-generated from content/*.md by build.js
// Do not edit manually; edit files in content/*.md and run 'node build.js'

var miaecData = ${JSON.stringify(databaseRecords, null, 2)};
`;

  fs.writeFileSync(dataJsPath, dataJsContent, 'utf8');
  console.log(`✓ Regenerated data.js with ${databaseRecords.length} specifications!`);

  // Write sitemap.xml
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  sitemapUrls.forEach(u => {
    xml += `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>2026-10-19</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
  });
  xml += `</urlset>\n`;

  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`✓ Generated sitemap.xml with ${sitemapUrls.length} URLs!`);
}

build();
