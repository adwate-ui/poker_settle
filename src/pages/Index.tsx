import { TabsContent } from "@/components/ui/tabs";
import TabLayout from "@/components/layout/TabLayout";
import NewGame from "./NewGame";
import { OnboardingWizard } from "@/components/feedback/OnboardingWizard";

const Index = () => {
  return (
    <TabLayout defaultTab="new-game">
      {/* Onboarding wizard for new users */}
      <OnboardingWizard />

      <TabsContent value="new-game" className="mt-0">
        <NewGame />
      </TabsContent>
    </TabLayout>
  );
};

export default Index;
