import { TabsContent } from "@/components/ui/tabs";
import TabLayout from "@/components/layout/TabLayout";
import { OverviewDashboard } from "@/components/game/OverviewDashboard";
import { OnboardingWizard } from "@/components/feedback/OnboardingWizard";

const Index = () => {
  return (
    <TabLayout defaultTab="overview">
      {/* Onboarding wizard for new users */}
      <OnboardingWizard />

      <TabsContent value="overview" className="mt-0">
        <OverviewDashboard />
      </TabsContent>
    </TabLayout>
  );
};

export default Index;
