import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/authonly.tsx", [route("/", "routes/home.tsx")]),
  layout("routes/authnever.tsx", [
    route("signup", "routes/signup.tsx"),
    route("login", "routes/login.tsx"),
  ]),
  route("forgot-password", "routes/forgot-password.tsx"),
] satisfies RouteConfig;
