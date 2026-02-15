// Re-export everything from the shared store for backwards compatibility
export {
  type UserProfile as MobileUserProfile,
  type UserProfile,
  getUserProfile as getMobileProfile,
  saveUserProfile as saveMobileProfile,
  clearUserProfile as clearMobileProfile,
  getUserProfile,
  saveUserProfile,
  clearUserProfile,
} from './store';
