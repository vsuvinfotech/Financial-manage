import { asyncHandler } from "../../utils/async-handler.js";
import { authService } from "./auth.service.js";

export const authController = {
  register: asyncHandler(async (req, res) => {
    // New users belong to the creator's company; platform admins may target a company via body.
    const companyId = req.user?.companyId ?? (req.body.companyId as string | undefined) ?? null;
    const result = await authService.register({ ...req.body, companyId });
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req, res) => {
    const companySlug =
      (req.headers["x-tenant-slug"] as string | undefined) ||
      (req.body.companySlug as string | undefined);
    const result = await authService.login({ ...req.body, companySlug });
    res.json(result);
  }),

  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(result);
  }),

  logout: asyncHandler(async (_req, res) => {
    res.status(204).send();
  }),
};
