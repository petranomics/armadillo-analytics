import PlatformPage from '@/components/PlatformPage';
import { mockTwitterData } from '@/lib/mock-data';

export default function TwitterPage() {
  return <PlatformPage mockData={mockTwitterData} platform="twitter" />;
}
