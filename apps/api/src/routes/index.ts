import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { dashboardRoutes } from "../modules/dashboard/dashboard.routes.js";
import { dailyClosingRoutes } from "../modules/daily-closing/daily-closing.routes.js";
import { expenseRoutes, purchaseRoutes, revenueRoutes } from "../modules/entries/entry.routes.js";
import { reportRoutes } from "../modules/reports/reports.routes.js";
import { userRoutes } from "../modules/users/users.routes.js";
import { rolesRoutes } from "../modules/roles/roles.routes.js";
import { categoriesRoutes } from "../modules/categories/categories.routes.js";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/users", userRoutes);
apiRoutes.use("/roles", rolesRoutes);
apiRoutes.use("/categories", categoriesRoutes);
apiRoutes.use("/revenues", revenueRoutes);
apiRoutes.use("/expenses", expenseRoutes);
apiRoutes.use("/purchases", purchaseRoutes);
apiRoutes.use("/reports", reportRoutes);
apiRoutes.use("/dashboard", dashboardRoutes);
apiRoutes.use("/daily-closing", dailyClosingRoutes);
