import PlatformPage from '@/components/PlatformPage';
import { mockYouTubeData } from '@/lib/mock-data';

export default function YouTubePage() {
  return <PlatformPage mockData={mockYouTubeData} platform="youtube" />;
}
