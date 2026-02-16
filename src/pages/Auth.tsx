import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldCheck, Gamepad2, Coins, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "@/lib/notifications";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

const Auth = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address";
    return undefined;
  };

  const validatePassword = (value: string, isSignUp: boolean): string | undefined => {
    if (!value) return "Password is required";
    if (isSignUp && value.length < 8) return "Password must be at least 8 characters";
    return undefined;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, false);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setIsSigningIn(true);
    try {
      await signInWithEmail(email, password);
      toast.success("Welcome back!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in";
      if (errorMessage.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, true);
    const confirmError = password !== confirmPassword ? "Passwords do not match" : undefined;

    if (emailError || passwordError || confirmError) {
      setErrors({ email: emailError, password: passwordError, confirmPassword: confirmError });
      return;
    }

    setIsSigningIn(true);
    try {
      await signUpWithEmail(email, password);
      toast.success("Account created! Please check your email to verify your account.");
      setActiveTab("signin");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create account";
      if (errorMessage.includes("already registered")) {
        toast.error("This email is already registered. Try signing in instead.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrors({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
        </div>
        <p className="text-label tracking-[0.3em] text-muted-foreground animate-pulse">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />

      <Card className="w-full max-w-md glass-panel relative overflow-hidden group">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <CardHeader className="pt-10 pb-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
            <div className="relative flex flex-col items-center">
              <Coins className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="space-y-1">
            <CardTitle className="text-3xl font-luxury tracking-tight text-foreground">
              Poker Settle
            </CardTitle>
            <CardDescription className="text-label tracking-[0.3em] text-muted-foreground">
              Game Management & Settlements
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10 space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); resetForm(); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                      className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                      disabled={isSigningIn}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                      className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                      disabled={isSigningIn}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full h-11"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                      className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                      disabled={isSigningIn}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (min 8 chars)"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                      className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                      disabled={isSigningIn}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                      className={`pl-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                      disabled={isSigningIn}
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full h-11"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background/40 px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full h-11 gap-3"
          >
            {isSigningIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            Sign in with Google
          </Button>

          <div className="pt-2 flex items-center justify-center gap-6 opacity-40 hover:opacity-100 transition-all duration-500 cursor-default">
            <div className="flex items-center gap-2 group/icon">
              <Gamepad2 className="h-4 w-4 group-hover/icon:text-primary transition-colors" />
              <span className="text-label hidden sm:inline">Fair Play</span>
            </div>
            <div className="w-px h-3 bg-muted" />
            <div className="flex items-center gap-2 group/icon">
              <ShieldCheck className="h-4 w-4 group-hover/icon:text-primary transition-colors" />
              <span className="text-label hidden sm:inline">Secure</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-8 text-center w-full pointer-events-none">
        <p className="text-label tracking-[0.5em] text-muted-foreground">Secure Game Management</p>
      </div>
    </div>
  );
};

export default Auth;
