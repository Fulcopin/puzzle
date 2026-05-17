/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // <--- AGREGA ESTA LÍNEA AQUÍ
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig