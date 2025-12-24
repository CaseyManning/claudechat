import { href, Outlet, redirect } from "react-router";
import { getOptionalUser } from "~/utils/global-context";

export function loader() {
  const user = getOptionalUser();
  if (user) {
    throw redirect(href("/"));
  }
}

export default function AuthNever() {
  return <Outlet />;
}
