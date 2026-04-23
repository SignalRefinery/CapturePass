/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const production = process.env.NODE_ENV === "production";

    if (!production) {
      return [];
    }

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          }
        ]
      }
    ];
  }
};

export default nextConfig;