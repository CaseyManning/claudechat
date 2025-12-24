import { loginFormSchema } from "~/auth/login.schema";
import { loginUser } from "~/auth/user.server";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, href, Link, redirect } from "react-router";
import { getValidatedFormData, useRemixForm } from "remix-hook-form";
import Button from "~/components/ui/button";
import { Input, InputError, InputField } from "~/components/ui/input";
import type { Route } from "./+types/login";

const resolver = zodResolver(loginFormSchema);

export const action = async ({ request }: Route.ActionArgs) => {
  const { errors, data } = await getValidatedFormData(request, resolver);
  if (errors) {
    return { errors };
  }
  const { errors: loginErrors } = await loginUser(data);
  if (loginErrors) {
    return {
      errors: loginErrors,
    };
  }

  return redirect(href("/"));
};

export default function LoginRoute() {
  const { handleSubmit, register, formState } = useRemixForm({
    resolver,
  });
  return (
    <Form
      onSubmit={handleSubmit}
      className="flex h-full items-center justify-center"
      method="post"
    >
      <div className="mx-auto flex h-full w-full flex-col items-center justify-center gap-4 max-w-xl">
        <p className="mb-2 self-start font-bold text-black">Login</p>
        <InputField>
          <Input
            {...register("email")}
            error={!!formState.errors.email}
            placeholder="Enter your email"
            autoFocus
            className="w-full"
          />
          <InputError>{formState.errors.email?.message}</InputError>
        </InputField>
        <InputField>
          <Input
            {...register("password")}
            error={!!formState.errors.password}
            placeholder="Enter your password"
            className="w-full"
            type="password"
          />
          <InputError>{formState.errors.password?.message}</InputError>
        </InputField>

        <div className="self-end flex items-center gap-4">
          <Link
            to={href("/forgot-password")}
            className="text-sm text-zinc-500 hover:underline"
          >
            Forgot password?
          </Link>
          <Button type="submit" color="black">
            Login
          </Button>
        </div>
      </div>
    </Form>
  );
}
