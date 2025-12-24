import { registerUser } from "~/auth/user.server";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, href, Link, redirect } from "react-router";
import { getValidatedFormData, useRemixForm } from "remix-hook-form";
import Button from "../components/ui/button";
import { Input, InputError, InputField } from "../components/ui/input";
import { registerFormSchema } from "~/auth/register.schema";
import type { Route } from "./+types/signup";

const resolver = zodResolver(registerFormSchema);

export const action = async ({ request }: Route.ActionArgs) => {
  const { errors, data } = await getValidatedFormData(request, resolver);
  if (errors) {
    return { errors };
  }
  const { errors: registrationErrors } = await registerUser(data);

  if (registrationErrors) {
    return {
      errors: registrationErrors,
    };
  }

  return redirect(href("/"));
};

export default function SignupRoute() {
  const { handleSubmit, register, formState } = useRemixForm({
    resolver,
  });
  return (
    <Form
      onSubmit={handleSubmit}
      className="mx-auto flex h-full w-full items-center justify-center p-3"
      method="post"
    >
      <div className="mx-auto flex h-full w-full flex-col items-center justify-center gap-4 max-w-xl">
        <p className="mb-2 self-start text-2xl text-black">Sign up</p>
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
        <InputField>
          <Input
            {...register("confirmPassword")}
            error={!!formState.errors.confirmPassword}
            placeholder="Confirm password"
            type="password"
            className="w-full"
          />
          <InputError>{formState.errors.confirmPassword?.message}</InputError>
        </InputField>
        <div className="self-end flex items-center gap-4">
          <Link to="/login" className="text-sm text-zinc-500 hover:underline">
            Log in
          </Link>
          <Button
            type="submit"
            color="black"
            className="rounded-none p-3! px-5!"
          >
            Sign up
          </Button>
        </div>
      </div>
    </Form>
  );
}
