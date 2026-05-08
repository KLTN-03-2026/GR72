import { ExpertLayout } from '@/components/expert/expert-layout'
import '../user/user.css'

export default function NutritionistLayout({ children }: { children: React.ReactNode }) {
  return <ExpertLayout>{children}</ExpertLayout>
}
