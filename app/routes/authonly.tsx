import { href, redirect } from "react-router";
import { getOptionalUser } from "~/utils/global-context";

export function loader() {
  const user = getOptionalUser();
  if (!user) {
    throw redirect(href("/login"));
  }
}
