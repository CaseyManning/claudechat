import type { Route } from "./+types/settings";

export function meta({}: Route.MetaArgs) {
  return [{ title: "settings" }];
}

export default function Settings() {
  return null;
}
