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

const BASE_URL = 'https://www.cathedradigital.com.br';
const DEFAULT_OG_IMAGE = 'https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-home.png';

const SEOHead = ({ title, description, path, keywords, type = 'website', breadcrumbs, faqs, image }: SEOHeadProps) => {
  const { data: seoSettings } = useSEO();
  
  const siteTitle = seoSettings?.site_title || 'Cathedra Digital';
  const displayTitle = title ? `${title} — ${siteTitle}` : siteTitle;
  const displayDescription = description || seoSettings?.site_description || 'Aprofunde sua fé católica com Bíblia Sagrada, Catecismo da Igreja, vidas dos santos, liturgia diária e IA teológica.';
  const displayKeywords = keywords || seoSettings?.site_keywords || '';
  
  const getDynamicImage = (title?: string) => {
    // If a specific image is provided for the page, use it
    if (image) return image;
    
    // Check if we have a global custom OG image in settings
    if (seoSettings?.og_image_url) return seoSettings.og_image_url;
    
    // Generate a dynamic image URL with "cache" (stable hash/parameters)
    const pageTitle = title || siteTitle;
    const encodedTitle = encodeURIComponent(pageTitle);
    
    // Cache buster based on version or month to ensure stability but allow updates
    const cacheKey = new Date().toISOString().split('T')[0].substring(0, 7); // yyyy-mm
    
    // Primary dynamic service (placehold.jp is used as a generator here)
    // We can use a more "premium" look by styling it
    return `https://placehold.jp/40/1a1a1a/ffffff/1200x630.png?text=${encodedTitle}%0A%0ACathedra%20Digital&css=%7B%22font-family%22%3A%22serif%22%7D&v=${cacheKey}`;
  };

  const displayImage = getDynamicImage(title);
  const twitterHandle = seoSettings?.twitter_handle || '@cathedradigital';

  
  // Normalize URL for canonical: remove all query params except essential ones if needed
  // In most cases for Cathedra, we want to point to the base path to avoid duplicate content from searches
  const url = `${BASE_URL}${path.split('?')[0]}`;

  // Google Analytics 4 Script Injection
  useEffect(() => {
    const rawId = seoSettings?.ga4_measurement_id;
    // Strict format allowlist: prevents script injection via tampered DB values
    const safeId = rawId && /^G-[A-Z0-9]{4,20}$/.test(rawId) ? rawId : null;
    if (safeId && typeof window !== 'undefined') {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(safeId)}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      // Use textContent so the value is treated as a string literal, not parsed as code
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
        "item": BASE_URL
      },
      ...(breadcrumbs || []).map((b, i) => ({
        "@type": "ListItem",
        "position": i + 2,
        "name": b.name,
        "item": `${BASE_URL}${b.path}`
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

  const globalSchema = seoSettings?.json_ld_schema;

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteTitle,
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Cathedra Digital",
    "url": BASE_URL,
    "logo": "https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/logo-cathedra.png",
    "sameAs": [
      "https://instagram.com/cathedradigital",
      "https://twitter.com/cathedradigital"
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

  return (
    <Helmet>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preload" as="image" href="/src/assets/cathedra-logo.png" />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <title>{displayTitle}</title>
      <meta name="description" content={displayDescription} />
      {displayKeywords && <meta name="keywords" content={displayKeywords} />}
      <link rel="canonical" href={url} />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
      
      {/* Google Search Console Verification */}
      {seoSettings?.gsc_verification_code && (
        <meta name="google-site-verification" content={seoSettings.gsc_verification_code} />
      )}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Cathedra Digital" />
      <meta property="og:title" content={displayTitle} />
      <meta property="og:description" content={displayDescription} />
      
      {/* Primary OG image */}
      <meta property="og:image" content={displayImage} />
      <meta property="og:image:secure_url" content={displayImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:alt" content={displayTitle} />
      
      {/* Fallback OG images */}
      {image && image !== DEFAULT_OG_IMAGE && (
        <>
          <meta property="og:image" content={DEFAULT_OG_IMAGE} />
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


      <script type="application/ld+json">{JSON.stringify(breadcrumbLD)}</script>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>

      {breadcrumbLD && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbLD)}</script>
      )}
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
