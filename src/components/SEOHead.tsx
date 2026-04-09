import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  type?: string;
}

const BASE_URL = 'https://cathedradigital.lovable.app';
const OG_IMAGE = 'https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-image.png';

const SEOHead = ({ title, description, path, keywords, type = 'website' }: SEOHeadProps) => {
  const fullTitle = `${title} — Cathedra Digital`;
  const url = `${BASE_URL}${path}`;

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
    </Helmet>
  );
};

export default SEOHead;
