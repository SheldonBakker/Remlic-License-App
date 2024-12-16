/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from "react";

interface StructuredDataProps {
  type: "website" | "organization" | "product" | "article" | "breadcrumb";
  data: any;
}

const StructuredData: FC<StructuredDataProps> = ({ type, data }) => {
  const getStructuredData = () => {
    switch (type) {
      case "website":
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "RemLic",
          url: "https://remlic.co.za",
          ...data,
        };
      case "organization":
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "RemLic",
          url: "https://remlic.co.za",
          logo: "https://remlic.co.za/logo.png",
          ...data,
        };
      case "product":
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "RemLic License Management",
          applicationCategory: "BusinessApplication",
          ...data,
        };
      case "article":
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          ...data,
        };
      case "breadcrumb":
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: data.items,
        };
      default:
        return {};
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(getStructuredData()) }}
    />
  );
};

export default StructuredData;
