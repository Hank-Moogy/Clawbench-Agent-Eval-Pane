import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@clerk/clerk-react";

export const Route = createFileRoute("/sign-up/$")({
  component: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  ),
});
