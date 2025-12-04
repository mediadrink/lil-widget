// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/create",
          "/widget/",
          "/widget-frame",
        ],
      },
    ],
    sitemap: "https://www.lilwidget.com/sitemap.xml",
  };
}
