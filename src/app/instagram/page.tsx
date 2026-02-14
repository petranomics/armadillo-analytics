import PlatformPage from '@/components/PlatformPage';
import { mockInstagramData } from '@/lib/mock-data';

export default function InstagramPage() {
  return <PlatformPage mockData={mockInstagramData} platform="instagram" />;
}
