import React from "react";
import { SharedProvider, useSharedContext } from "@/contexts/SharedContext";
import { Loader2, Shield } from "lucide-react";
import GamesHistory from "./GamesHistory";
import PlayerDetail from "./PlayerDetail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SharedContent = () => {
    const { scope, sharedClient, isLoading, isValid, isGameToken } = useSharedContext();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isValid || !scope) {
        return (
            <div className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center">
                <Alert variant="destructive" className="max-w-md">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                        Invalid or expired share link. Please contact the owner for a valid link.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b bg-card">
                <div className="max-w-7xl mx-auto p-4 sm:p-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold font-luxury">Poker Stats</h1>
                        <div className="flex items-center gap-2 text-label text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="text-primary font-bold">Shared View</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-8">
                {isGameToken ? (
                    <GamesHistory
                        userId={scope.ownerId}
                        client={sharedClient}
                        readOnly={true}
                        disablePlayerLinks={true}
                    />
                ) : (
                    <Tabs defaultValue="games" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="games">Game History</TabsTrigger>
                            <TabsTrigger value="player">Player Details</TabsTrigger>
                        </TabsList>
                        <TabsContent value="games">
                            <GamesHistory
                                userId={scope.ownerId}
                                client={sharedClient}
                                readOnly={true}
                                disablePlayerLinks={true}
                            />
                        </TabsContent>
                        <TabsContent value="player">
                            <PlayerDetail
                                playerId={scope.resourceId}
                                userId={scope.ownerId}
                                client={sharedClient}
                                readOnly={true}
                            />
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
};

export default function SharedLayout() {
    return (
        <SharedProvider>
            <SharedContent />
        </SharedProvider>
    );
}
