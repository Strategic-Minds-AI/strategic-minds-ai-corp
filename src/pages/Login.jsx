import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { signIn } from "@/lib/supabaseAuthClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleAuthAlternative from '@/components/auth/GoogleAuthAlternative';
import authErrorMessage from '@/components/auth/authErrorMessage';
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoadingAuth, authError } = useAuth();
  const signInError = error || (authError ? authErrorMessage(authError) : '');
  useEffect(() => {
    if (isAuthenticated && !isLoadingAuth) window.location.replace(safeReturnTo());
  }, [isAuthenticated, isLoadingAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title={safeReturnTo().startsWith('/admin') ? 'Admin sign-in' : 'Welcome back'}
      subtitle={safeReturnTo().startsWith('/admin') ? 'Use your approved owner account. If you have not registered yet, select Create one below and verify your email.' : 'Log in to your account'}
      footer={
        <>
          Don't have an account?{" "}
          <a href={`/register?returnTo=${encodeURIComponent(safeReturnTo())}`} className="inline-flex min-h-11 items-center text-primary font-medium hover:underline">
            Create one
          </a>
        </>
      }
    >
      {signInError && (
        <div role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {signInError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
      <GoogleAuthAlternative disabled={loading} onError={failure => setError(failure ? authErrorMessage(failure) : '')}/>
    </AuthLayout>
  );
}