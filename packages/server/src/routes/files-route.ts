import { RequestHandler, Router } from "express"
import logger from "../logger"
import * as fs from "fs"
import fileClient from "../clients/ipfs"
import { asyncHandler, defaultPath } from "./utils"
import { joinPath, splitPath } from "@crate/utils"

const { getFile, addFile, rmFile } = fileClient

const router: Router = Router()

const post: RequestHandler = async (req, res) => {
  if (!req.token) throw new Error("Token expected to exist.")
  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send({
      error: { reason: "BAD_REQUEST", details: "No files were uploaded." },
    })
    return
  }

  const { uid } = req.token
  const { path } = {
    path: await defaultPath(uid),
    ...req.query,
  }

  const { files } = req.files
  const fileArr = Array.isArray(files) ? files : [files]

  let nextPath = path
  const models = []
  for (const file of fileArr) {
    const buffer = fs.createReadStream(file.tempFilePath)
    const [model, newPath] = await addFile({
      path: nextPath,
      uid,
      filename: file.name,
      file: buffer,
    })
    models.push(model)
    nextPath = joinPath("ipfs", ...splitPath(newPath).slice(0, -1))
  }

  logger.info(JSON.stringify(models))
  res.send(models)
}

const get: RequestHandler = async (req, res) => {
  if (!req.token) throw new Error("Token expected to exist.")
  const { path } = {
    path: `/ipfs/${req.token.uid}`,
    ...req.query,
  }

  const model = await getFile({ path })
  res.send(model)
}

const del: RequestHandler = async (req, res) => {
  if (!req.token) throw new Error("Token expected to exist.")
  const { path } = {
    path: `/ipfs/${req.token.uid}`,
    ...req.query,
  }

  const newPath = await rmFile({ path, uid: req.token.uid })
  res.send(newPath)
}

router.get("/", asyncHandler(get))
router.post("/", asyncHandler(post))
router.delete("/", asyncHandler(del))

export default router
