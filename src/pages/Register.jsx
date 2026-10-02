import React, { useState } from "react";
import { Link } from "react-router-dom";
import { signUp } from "@/lib/supabaseAuthClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleAuthAlternative from '@/components/auth/GoogleAuthAlternative';
import authErrorMessage from '@/components/auth/authErrorMessage';
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError('Use a password with at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await signUp(email, password);
      // If Supabase returns a session immediately (email confirmation disabled),
      // redirect right away. Otherwise, show the "check your email" screen.
      if (data?.session) {
        window.location.href = safeReturnTo();
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout
        icon={Mail}
        title="Check your email"
        subtitle={`We sent a confirmation link to ${email}`}
      >
        <p className="text-sm text-foreground text-center">
          Click the link in the email to verify your account, then log in.
        </p>
        <div className="mt-6 text-center">
          <Link to={`/login?returnTo=${encodeURIComponent(safeReturnTo())}`} className="text-primary font-medium hover:underline">
            Back to log in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Create an account using your email and password. Google is optional."
      footer={
        <>
          Already have an account?{" "}
          <a href={`/login?returnTo=${encodeURIComponent(safeReturnTo())}`} className="inline-flex min-h-11 items-center text-primary font-medium hover:underline">
            Log in
          </a>
        </>
      }
    >
      {error && (
        <div role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              minLength={6}
              aria-describedby="signup-password-help"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <p id="signup-password-help" className="mb-0 text-xs text-muted-foreground">Use at least 6 characters.</p>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
      <GoogleAuthAlternative disabled={loading} onError={failure => setError(failure ? authErrorMessage(failure) : '')}/>
    </AuthLayout>
  );
}