import { Helmet } from 'react-helmet-async';
import { useSEO } from '@/hooks/useSEO';
import { useEffect } from 'react';
import { SEO_CONFIG } from '@/config/seo';

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

const SEOHead = ({ title, description, path, keywords, type = 'website', breadcrumbs, faqs, image }: SEOHeadProps) => {
  const { data: seoSettings } = useSEO();
  
  const siteTitle = seoSettings?.site_title || 'Cathedra Digital';
  const displayTitle = title ? `${title} — ${siteTitle}` : siteTitle;
  const displayDescription = description || seoSettings?.site_description || 'Aprofunde sua fé católica com Bíblia Sagrada, Catecismo da Igreja, vidas dos santos, liturgia diária e IA teológica.';
  const displayKeywords = keywords || seoSettings?.site_keywords || '';
  
  const getDynamicImage = (title?: string) => {
    if (image) return image;
    if (seoSettings?.og_image_url) return seoSettings.og_image_url;
    
    const pageTitle = title || siteTitle;
    const encodedTitle = encodeURIComponent(pageTitle);
    const cacheKey = new Date().toISOString().split('T')[0].substring(0, 7);
    
    return `https://placehold.jp/40/1a1a1a/ffffff/1200x630.png?text=${encodedTitle}%0A%0ACathedra%20Digital&css=%7B%22font-family%22%3A%22serif%22%7D&v=${cacheKey}`;
  };

  const displayImage = getDynamicImage(title);
  const twitterHandle = seoSettings?.twitter_handle || '@cathedradigital';
  const url = `${SEO_CONFIG.BASE_URL}${path.split('?')[0]}`;

  useEffect(() => {
    const rawId = seoSettings?.ga4_measurement_id;
    const safeId = rawId && /^G-[A-Z0-9]{4,20}$/.test(rawId) ? rawId : null;
    if (safeId && typeof window !== 'undefined') {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(safeId)}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(safeId)});`;
      document.head.appendChild(script2);

      return () => {
        if (document.head.contains(script1)) document.head.removeChild(script1);
        if (document.head.contains(script2)) document.head.removeChild(script2);
      };
    }
  }, [seoSettings?.ga4_measurement_id]);

  const breadcrumbLD = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SEO_CONFIG.BASE_URL
      },
      ...(breadcrumbs || []).map((b, i) => ({
        "@type": "ListItem",
        "position": i + 2,
        "name": b.name,
        "item": `${SEO_CONFIG.BASE_URL}${b.path}`
      }))
    ]
  };

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

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteTitle,
    "url": SEO_CONFIG.BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SEO_CONFIG.BASE_URL}${SEO_CONFIG.SEARCH_PATH}?${SEO_CONFIG.SEARCH_PARAM}={search_term_string}`,
      "query-input": `required name=search_term_string`
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SEO_CONFIG.ORGANIZATION.name,
    "url": SEO_CONFIG.BASE_URL,
    "logo": SEO_CONFIG.ORGANIZATION.logo,
    "sameAs": [
      SEO_CONFIG.ORGANIZATION.instagram,
      SEO_CONFIG.ORGANIZATION.twitter
    ]
  };

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
      "addressLocality": "São Paulo",
      "addressRegion": "SP",
      "addressCountry": "BR"
    },
    "openingHours": seoSettings.opening_hours,
    "geo": (seoSettings.latitude && seoSettings.longitude) ? {
      "@type": "GeoCoordinates",
      "latitude": seoSettings.latitude,
      "longitude": seoSettings.longitude
    } : null
  } : null;

  const globalSchema = seoSettings?.json_ld_schema;

  return (
    <Helmet>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preload" as="image" href="/src/assets/cathedra-logo.webp" />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <title>{displayTitle}</title>
      <meta name="description" content={displayDescription} />
      {displayKeywords && <meta name="keywords" content={displayKeywords} />}
      <link rel="canonical" href={url} />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
      
      {seoSettings?.gsc_verification_code && (
        <meta name="google-site-verification" content={seoSettings.gsc_verification_code} />
      )}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Cathedra Digital" />
      <meta property="og:title" content={displayTitle} />
      <meta property="og:description" content={displayDescription} />
      <meta property="og:image" content={displayImage} />
      <meta property="og:image:secure_url" content={displayImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:alt" content={displayTitle} />
      
      {image && image !== SEO_CONFIG.DEFAULT_OG_IMAGE && (
        <>
          <meta property="og:image" content={SEO_CONFIG.DEFAULT_OG_IMAGE} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
        </>
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={displayTitle} />
      <meta name="twitter:description" content={displayDescription} />
      <meta name="twitter:image" content={displayImage} />
      <meta name="twitter:image:alt" content={displayTitle} />

      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbLD)}</script>
      {faqLD && (
        <script type="application/ld+json">{JSON.stringify(faqLD)}</script>
      )}
      {globalSchema && (
        <script type="application/ld+json">{JSON.stringify(globalSchema)}</script>
      )}
      {localBusinessLD && (
        <script type="application/ld+json">{JSON.stringify(localBusinessLD)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
