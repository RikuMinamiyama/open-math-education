import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminProblemsPage } from "./pages/admin/AdminProblemsPage";
import { ProblemEditPage } from "./pages/admin/ProblemEditPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LoginPage } from "./pages/LoginPage";
import { ProblemPage } from "./pages/ProblemPage";
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
			{ path: "history", element: <HistoryPage /> },
			{ path: "login", element: <LoginPage /> },
			{ path: "signup", element: <SignupPage /> },
			{ path: "admin", element: <AdminProblemsPage /> },
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
