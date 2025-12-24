import { database } from "~/database/context";

import type { Route } from "./+types/home";
import { getUser } from "~/utils/global-context";
import { useLoaderData } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [{ title: "fashion" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const db = database();

  const user = getUser();

  return {
    user,
  };
}

export default function Home() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-row min-h-screen h-fitcontent flex-nowrap bg-pagebg bg-[#fcfcfc]">
      <p>username: {user?.email}</p>
    </div>
  );
}
