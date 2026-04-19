"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useVertical } from "@nrivera-iimp/ui-kit-iimp";

export default function DynamicMetadata() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const verticalContext = useVertical();
  const vertical = verticalContext?.vertical;

  useEffect(() => {
    if (!vertical) {
      console.log("DynamicMetadata: Vertical not found in context yet.");
      return;
    }

    const updateMetadata = () => {
      console.log(
        "DynamicMetadata: Updating metadata for:",
        vertical,
        "at",
        pathname
      );

      // 1. Update Title
      const currentYear = new Date().getFullYear();
      const verticalLabel = vertical.toUpperCase();
      const newTitle = `${verticalLabel} - ${currentYear}`;
      document.title = newTitle;

      // 2. Update Favicon
      let faviconName = `favicon-${vertical.toLowerCase()}.png`;
      if (vertical.toLowerCase() === "proexplo") {
        faviconName = "favicon-iimp.png";
      }
      const faviconUrl = `/logos/${faviconName}`;
      // Force change all icon-related links
      const iconSelectors = [
        "link[rel*='icon']",
        "link[rel='apple-touch-icon']",
        "link[rel='shortcut icon']",
      ];
      let linkFound = false;

      iconSelectors.forEach((selector) => {
        const links = document.querySelectorAll(selector);
        links.forEach((link) => {
          (link as HTMLLinkElement).href = faviconUrl;
          linkFound = true;
        });
      });

      if (!linkFound) {
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.href = faviconUrl;
        document.head.appendChild(newLink);
      }
    };

    // Run immediately and after a short delay to be sure
    updateMetadata();
    const timeoutId = setTimeout(updateMetadata, 500);

    return () => clearTimeout(timeoutId);
  }, [vertical, pathname, searchParams]);

  return null;
}
