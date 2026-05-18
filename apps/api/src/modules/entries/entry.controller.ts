import { asyncHandler } from "../../utils/async-handler.js";
import { createEntryService } from "./entry.service.js";

export function createEntryController(model: "revenue" | "expense" | "purchase") {
  const service = createEntryService(model);
  return {
    list: asyncHandler(async (req, res) => {
      res.json(await service.list(req.query));
    }),
    create: asyncHandler(async (req, res) => {
      res.status(201).json(await service.create(req.body, req.user!.id));
    }),
    update: asyncHandler(async (req, res) => {
      res.json(await service.update(req.params.id, req.body));
    }),
    remove: asyncHandler(async (req, res) => {
      await service.remove(req.params.id);
      res.status(204).send();
    }),
  };
}
