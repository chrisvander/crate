import { Pin, PinStatus, Status } from "@crate/types"
import { Router } from "express"
import { uuid } from "uuidv4"

const router: Router = Router()

router.get("/", (req, res) => {
  const fcRes = "List of pin objects."
  res.send(fcRes)
})

function checkPin(obj: unknown): obj is Pin {
  const objCast: Pin = obj as Pin
  if (
    objCast.status &&
    objCast.cid &&
    typeof objCast.status === "string" &&
    typeof objCast.cid === "string"
  ) {
    return true
  }
  return false
}

router.post("/", (req, res) => {
  const pin = req.body as unknown
  if (!checkPin(pin)) {
    res.sendStatus(400)
    return
  }

  const pinStatus: PinStatus = {
    requestid: uuid(),
    status: Status.Queued,
    created: new Date().toISOString(),
    delegates: [],
    pin,
  }

  res.send(pinStatus)
})

router.get(/\/(.+)$/, (req, res) => {
  const reqId = req.params[0]
  const fcRes = `Get pin object with ID ${reqId}.`
  res.send(fcRes)
})

router.post(/\/(.+)$/, (req, res) => {
  const reqId = req.params[0]
  const fcRes = `Replace pin object with ID ${reqId}.`
  res.send(fcRes)
})

router.delete(/\/(.+)$/, (req, res) => {
  const reqId = req.params[0]
  const fcRes = `Remove pin object with ID ${reqId}.`
  res.send(fcRes)
})

export default router
