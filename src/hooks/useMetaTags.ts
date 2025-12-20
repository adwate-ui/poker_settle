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
    const originalOgTitle = document.querySelector('meta[property="og:title"]');
    const originalOgDescription = document.querySelector('meta[property="og:description"]');
    
    const originalCanonicalHref = originalCanonical?.getAttribute('href');
    const originalOgUrlContent = originalOgUrl?.getAttribute('content');
    const originalOgTitleContent = originalOgTitle?.getAttribute('content');
    const originalOgDescriptionContent = originalOgDescription?.getAttribute('content');
    const originalDocumentTitle = document.title;

    // Track which elements we created (vs modified)
    let createdCanonical = false;
    let createdOgUrl = false;
    let createdOgTitle = false;
    let createdOgDescription = false;

    // Update or create canonical link
    if (config.url) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
        createdCanonical = true;
      }
      canonicalLink.href = config.url;

      // Update or create og:url meta tag
      let ogUrlMeta = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
      if (!ogUrlMeta) {
        ogUrlMeta = document.createElement('meta');
        ogUrlMeta.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrlMeta);
        createdOgUrl = true;
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
        createdOgTitle = true;
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
        createdOgDescription = true;
      }
      ogDescriptionMeta.content = config.description;
    }

    // Cleanup: restore original values when component unmounts
    return () => {
      // Restore document title
      if (config.title) {
        document.title = originalDocumentTitle;
      }

      if (config.url) {
        const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (canonicalLink) {
          if (createdCanonical) {
            canonicalLink.remove();
          } else if (originalCanonicalHref) {
            canonicalLink.href = originalCanonicalHref;
          }
        }

        const ogUrlMeta = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
        if (ogUrlMeta) {
          if (createdOgUrl) {
            ogUrlMeta.remove();
          } else if (originalOgUrlContent) {
            ogUrlMeta.content = originalOgUrlContent;
          }
        }
      }

      if (config.title) {
        const ogTitleMeta = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
        if (ogTitleMeta) {
          if (createdOgTitle) {
            ogTitleMeta.remove();
          } else if (originalOgTitleContent) {
            ogTitleMeta.content = originalOgTitleContent;
          }
        }
      }

      if (config.description) {
        const ogDescriptionMeta = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
        if (ogDescriptionMeta) {
          if (createdOgDescription) {
            ogDescriptionMeta.remove();
          } else if (originalOgDescriptionContent) {
            ogDescriptionMeta.content = originalOgDescriptionContent;
          }
        }
      }
    };
  }, [config.url, config.title, config.description]);
};
