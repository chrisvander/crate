import { RequestHandler, Router } from "express"
import { getContent } from "../files/content"
import { getFile } from "../files/read"
import { deleteFile, uploadFile } from "../files/write"
import { asyncHandler } from "./utils"

const router: Router = Router()

const post: RequestHandler = async (req, res) => {
  if (!req.user) throw new Error("User expected to exist.")
  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send({
      error: { reason: "BAD_REQUEST", details: "No files were uploaded." },
    })
    return
  }

  const path = typeof req.query["path"] === "string" ? req.query["path"] : "/"

  const { files } = req.files
  const fileArr = Array.isArray(files) ? files : [files]

  const models = await Promise.all(fileArr.map((file) => uploadFile(req.oauthSession, path, file)))
  res.send(models)
}

const get: RequestHandler = async (req, res) => {
  if (!req.user) throw new Error("User expected to exist.")
  if (typeof req.query["content"] === "string") {
    const content = await getContent(req.oauthSession, req.query["content"])
    res.type(content.mimeType).send(Buffer.from(content.bytes))
    return
  }

  const target =
    typeof req.query["cid"] === "string"
      ? req.query["cid"]
      : typeof req.query["path"] === "string"
        ? req.query["path"]
        : "/"
  res.send(await getFile(req.oauthSession, target))
}

const del: RequestHandler = async (req, res) => {
  if (!req.user) throw new Error("User expected to exist.")
  if (typeof req.query["path"] !== "string") {
    res.status(400).send("Path is required.")
    return
  }

  res.send(await deleteFile(req.oauthSession, req.query["path"]))
}

router.get("/", asyncHandler(get))
router.post("/", asyncHandler(post))
router.delete("/", asyncHandler(del))

export default router
