import { useEffect } from 'react';

interface MetaTagsConfig {
  url?: string;
  title?: string;
  description?: string;
}

/**
 * Hook to dynamically update meta tags for SEO and social sharing
 * Particularly useful for mobile screenshots which capture the URL
 */
export const useMetaTags = (config: MetaTagsConfig) => {
  useEffect(() => {
    // Store original values to restore on cleanup
    const originalCanonical = document.querySelector('link[rel="canonical"]');
    const originalOgUrl = document.querySelector('meta[property="og:url"]');
    const originalTitle = document.querySelector('meta[property="og:title"]');
    const originalDescription = document.querySelector('meta[property="og:description"]');
    
    const originalCanonicalHref = originalCanonical?.getAttribute('href');
    const originalOgUrlContent = originalOgUrl?.getAttribute('content');
    const originalTitleContent = originalTitle?.getAttribute('content');
    const originalDescriptionContent = originalDescription?.getAttribute('content');

    // Update or create canonical link
    if (config.url) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = config.url;

      // Update or create og:url meta tag
      let ogUrlMeta = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
      if (!ogUrlMeta) {
        ogUrlMeta = document.createElement('meta');
        ogUrlMeta.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrlMeta);
      }
      ogUrlMeta.content = config.url;
    }

    // Update title if provided
    if (config.title) {
      document.title = config.title;
      
      let ogTitleMeta = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (!ogTitleMeta) {
        ogTitleMeta = document.createElement('meta');
        ogTitleMeta.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitleMeta);
      }
      ogTitleMeta.content = config.title;
    }

    // Update description if provided
    if (config.description) {
      let ogDescriptionMeta = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
      if (!ogDescriptionMeta) {
        ogDescriptionMeta = document.createElement('meta');
        ogDescriptionMeta.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescriptionMeta);
      }
      ogDescriptionMeta.content = config.description;
    }

    // Cleanup: restore original values when component unmounts
    return () => {
      if (config.url) {
        const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (canonicalLink) {
          if (originalCanonicalHref) {
            canonicalLink.href = originalCanonicalHref;
          } else {
            canonicalLink.remove();
          }
        }

        const ogUrlMeta = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
        if (ogUrlMeta) {
          if (originalOgUrlContent) {
            ogUrlMeta.content = originalOgUrlContent;
          } else {
            ogUrlMeta.remove();
          }
        }
      }

      if (config.title) {
        const ogTitleMeta = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
        if (ogTitleMeta && originalTitleContent) {
          ogTitleMeta.content = originalTitleContent;
        }
      }

      if (config.description) {
        const ogDescriptionMeta = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
        if (ogDescriptionMeta && originalDescriptionContent) {
          ogDescriptionMeta.content = originalDescriptionContent;
        }
      }
    };
  }, [config.url, config.title, config.description]);
};
