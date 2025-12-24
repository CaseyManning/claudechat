import { href, Link } from "react-router";
import Button from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function ForgotPasswordRoute() {
  return (
    <div className="mx-auto flex h-full w-full flex-col items-center justify-center gap-4 max-w-xl">
      <p className="mb-2 self-start font-bold text-black">Forgot password</p>
      <Input className="w-full" placeholder="Enter your email" name="email" />
      <Link viewTransition={false} to={href("/login")} />
      <Button type="submit">Send password reset email</Button>
    </div>
  );
}
