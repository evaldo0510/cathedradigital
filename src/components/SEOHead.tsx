import { Helmet } from 'react-helmet-async';
import { useSEO } from '@/hooks/useSEO';
import { useEffect } from 'react';

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  path: string;
  keywords?: string;
  type?: string;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: FAQItem[];
  image?: string;
}

const BASE_URL = 'https://cathedradigital.lovable.app';
const DEFAULT_OG_IMAGE = 'https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-image.png';

const SEOHead = ({ title, description, path, keywords, type = 'website', breadcrumbs, faqs, image }: SEOHeadProps) => {
  const { data: seoSettings } = useSEO();
  
  const siteTitle = seoSettings?.site_title || 'Cathedra Digital';
  const displayTitle = title ? `${title} — ${siteTitle}` : siteTitle;
  const displayDescription = description || seoSettings?.site_description || 'Aprofunde sua fé católica com Bíblia Sagrada, Catecismo da Igreja, vidas dos santos, liturgia diária e IA teológica.';
  const displayKeywords = keywords || seoSettings?.site_keywords || '';
  const displayImage = image || seoSettings?.og_image_url || DEFAULT_OG_IMAGE;
  const twitterHandle = seoSettings?.twitter_handle || '@cathedradigital';
  
  const url = `${BASE_URL}${path}`;

  // Google Analytics 4 Script Injection
  useEffect(() => {
    if (seoSettings?.ga4_measurement_id && typeof window !== 'undefined') {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${seoSettings.ga4_measurement_id}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${seoSettings.ga4_measurement_id}');
      `;
      document.head.appendChild(script2);

      return () => {
        document.head.removeChild(script1);
        document.head.removeChild(script2);
      };
    }
  }, [seoSettings?.ga4_measurement_id]);

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

  const globalSchema = seoSettings?.json_ld_schema;

  const localBusinessLD = seoSettings?.business_name ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": seoSettings.business_name,
    "image": displayImage,
    "@id": url,
    "url": url,
    "telephone": seoSettings.business_whatsapp || seoSettings.business_phone,
    "email": seoSettings.business_email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": seoSettings.business_address,
      "addressLocality": "São Paulo", -- Could be dynamic if split
      "addressRegion": "SP",
      "addressCountry": "BR"
    },
    "openingHours": seoSettings.opening_hours,
    "geo": seoSettings.latitude && seoSettings.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": seoSettings.latitude,
      "longitude": seoSettings.longitude
    } : null
  } : null;

  return (
    <Helmet>
      <title>{displayTitle}</title>
      <meta name="description" content={displayDescription} />
      {displayKeywords && <meta name="keywords" content={displayKeywords} />}
      <link rel="canonical" href={url} />
      
      {/* Google Search Console Verification */}
      {seoSettings?.gsc_verification_code && (
        <meta name="google-site-verification" content={seoSettings.gsc_verification_code} />
      )}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={displayTitle} />
      <meta property="og:description" content={displayDescription} />
      <meta property="og:image" content={displayImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={displayTitle} />
      <meta name="twitter:description" content={displayDescription} />
      <meta name="twitter:image" content={displayImage} />

      {breadcrumbLD && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbLD)}</script>
      )}
      {faqLD && (
        <script type="application/ld+json">{JSON.stringify(faqLD)}</script>
      )}
      {globalSchema && (
        <script type="application/ld+json">{JSON.stringify(globalSchema)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;

