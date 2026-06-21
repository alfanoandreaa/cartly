import { SignUpContent } from "@/components/auth/signup-content";

export default function SignUpPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return <SignUpContent googleEnabled={googleEnabled} />;
}
