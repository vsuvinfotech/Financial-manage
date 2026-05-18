import { asyncHandler } from "../../utils/async-handler.js";
import { authService } from "./auth.service.js";

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
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
