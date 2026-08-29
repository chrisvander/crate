import { FileType } from "@crate/types"
import { RequestHandler, Router } from "express"
import { createFile } from "../files/write"
import { asyncHandler } from "./utils"

const router: Router = Router()

const routeMakeFile: RequestHandler = async (req, res) => {
  if (!req.user) throw new Error("User expected to exist.")
  if (
    typeof req.query["name"] !== "string" ||
    typeof req.query["path"] !== "string" ||
    (req.query["type"] !== "directory" && req.query["type"] !== "file")
  ) {
    res.status(400).send("Requires 'name' and 'path'")
    return
  }

  res.send(
    await createFile(
      req.oauthSession,
      req.query["path"],
      req.query["name"],
      req.query["type"] as FileType,
    ),
  )
}

router.post("/", asyncHandler(routeMakeFile))

export default router
