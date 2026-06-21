import { SignInContent } from "@/components/auth/signin-content";

export default function SignInPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return <SignInContent googleEnabled={googleEnabled} />;
}
