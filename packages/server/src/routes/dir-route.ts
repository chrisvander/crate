import { FileType } from "@crate/types"
import { RequestHandler, Router } from "express"
import fileClient from "../clients/ipfs"
import { asyncHandler } from "./utils"

const { makeFile } = fileClient

const router: Router = Router()

const routeMakeFile: RequestHandler = async (req, res) => {
  if (!req.token) throw new Error("Token expected to exist.")
  if (
    typeof req.query["name"] !== "string" ||
    typeof req.query["path"] !== "string" ||
    (req.query["type"] !== "directory" && req.query["type"] !== "file")
  ) {
    res.status(400).send("Requires 'name' and 'path'")
    return
  }

  res.send(
    await makeFile({
      name: req.query["name"],
      uid: req.token.uid,
      path: req.query["path"],
      type: req.query["type"] as FileType,
    }),
  )
}

const routeDirAdd: RequestHandler = async (req, res) => {
  res.send("done")
}

router.post("/", asyncHandler(routeMakeFile))
router.post("/add", asyncHandler(routeDirAdd))

export default router
