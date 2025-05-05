import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/auth/LoginForm";
import SignUpForm from "@/components/auth/SignUpForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [authMode, setAuthMode] = useState<"login" | "signup" | "reset">("login");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                {authMode === "reset" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAuthMode("login")}
                    className="flex items-center gap-1 px-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </Button>
                )}
              </div>
              <CardTitle className="text-2xl font-semibold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                {authMode === "login" && "Welcome back"}
                {authMode === "signup" && "Create an account"}
                {authMode === "reset" && "Reset your password"}
              </CardTitle>
              <CardDescription className="text-center text-slate-500">
                {authMode === "login" && "Enter your credentials to access your account"}
                {authMode === "signup" && "Fill in your details to get started"}
                {authMode === "reset" && "Enter your email to receive a reset link"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authMode === "reset" ? (
                <ResetPasswordForm />
              ) : (
                <Tabs defaultValue="login" value={authMode} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-8 bg-slate-100">
                    <TabsTrigger
                      value="login"
                      onClick={() => setAuthMode("login")}
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Login
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      onClick={() => setAuthMode("signup")}
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <LoginForm onForgotPassword={() => setAuthMode("reset")} />
                  </TabsContent>

                  <TabsContent value="signup">
                    <SignUpForm />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm text-slate-500">
                {authMode === "login" && (
                  <>
                    Don't have an account?{" "}
                    <button
                      onClick={() => setAuthMode("signup")}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                )}

                {authMode === "signup" && (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => setAuthMode("login")}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Login
                    </button>
                  </>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Auth;
