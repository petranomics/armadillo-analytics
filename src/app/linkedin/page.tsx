import PlatformPage from '@/components/PlatformPage';
import { mockLinkedInData } from '@/lib/mock-data';

export default function LinkedInPage() {
  return <PlatformPage mockData={mockLinkedInData} platform="linkedin" />;
}
