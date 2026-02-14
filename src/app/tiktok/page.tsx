import PlatformPage from '@/components/PlatformPage';
import { mockTikTokData } from '@/lib/mock-data';

export default function TikTokPage() {
  return <PlatformPage mockData={mockTikTokData} platform="tiktok" />;
}
