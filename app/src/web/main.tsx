import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminProblemsPage } from "./pages/admin/AdminProblemsPage";
import { AdminTagsPage } from "./pages/admin/AdminTagsPage";
import { AdminUnitPage } from "./pages/admin/AdminUnitPage";
import { ProblemEditPage } from "./pages/admin/ProblemEditPage";
import { TagEditPage } from "./pages/admin/TagEditPage";
import { LoginPage } from "./pages/LoginPage";
import { ProblemPage } from "./pages/ProblemPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SignupPage } from "./pages/SignupPage";
import { SubmissionPage } from "./pages/SubmissionPage";
import { UnitPage } from "./pages/UnitPage";
import { UnitsPage } from "./pages/UnitsPage";
import "./index.css";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		children: [
			{ index: true, element: <UnitsPage /> },
			{ path: "units/:slug", element: <UnitPage /> },
			{ path: "problems/:slug", element: <ProblemPage /> },
			{ path: "submissions/:id", element: <SubmissionPage /> },
			{ path: "history", element: <Navigate to="/" replace /> },
			{ path: "settings", element: <SettingsPage /> },
			{ path: "login", element: <LoginPage /> },
			{ path: "signup", element: <SignupPage /> },
			{ path: "admin", element: <AdminProblemsPage /> },
			{ path: "admin/tags", element: <AdminTagsPage /> },
			{ path: "admin/tags/new", element: <TagEditPage /> },
			{ path: "admin/tags/:slug", element: <TagEditPage /> },
			{ path: "admin/units/:slug", element: <AdminUnitPage /> },
			{ path: "admin/problems/new", element: <ProblemEditPage /> },
			{ path: "admin/problems/:slug", element: <ProblemEditPage /> },
		],
	},
]);

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);
