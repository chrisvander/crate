import { RequestHandler, Request, Response, NextFunction } from "express"
import logger from "../logger"

export const asyncHandler =
  (fn: RequestHandler) => async (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch((err) => {
      logger.error(err)
      next(err)
    })
  }
