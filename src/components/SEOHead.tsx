import { Helmet } from 'react-helmet-async';

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  type?: string;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: FAQItem[];
}

const BASE_URL = 'https://cathedradigital.lovable.app';
const OG_IMAGE = 'https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-image.png';

const SEOHead = ({ title, description, path, keywords, type = 'website', breadcrumbs, faqs }: SEOHeadProps) => {
  const fullTitle = `${title} — Cathedra Digital`;
  const url = `${BASE_URL}${path}`;

  const breadcrumbLD = breadcrumbs ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": b.name,
      "item": `${BASE_URL}${b.path}`
    }))
  } : null;

  const faqLD = faqs && faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  } : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={OG_IMAGE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />

      {breadcrumbLD && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbLD)}</script>
      )}
      {faqLD && (
        <script type="application/ld+json">{JSON.stringify(faqLD)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
