import express from "express"
import { auth } from "./user/firebase"
import files from "./routes/files-route"
import dirs from "./routes/dir-route"
import fileUpload from "express-fileupload"
import pinning from "./routes/pinning-route"
import logger from "./logger"
import morgan from "morgan"

// const args = process.argv.slice(2);
const app = express()

const API_VERSION = "v1"
const API_ROUTE = `/api/${API_VERSION}`

app.use(morgan("tiny"))
app.use((req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.sendStatus(403)
    return
  }

  const [type, token] = authHeader.split(" ")

  if (!token || type !== "Bearer") {
    res.status(403).send("Invalid request.")
    return
  }

  auth
    .verifyIdToken(token)
    .then((decodedToken) => {
      if (
        decodedToken.uid !== "hNDmf7OI3yUP0DhcULm64nGL1nI3" &&
        process.env["NODE_ENV"] === "production"
      )
        throw new Error("Unauthorized token.")
      req.token = decodedToken
      next()
    })
    .catch((err) => {
      res.status(403).send("Token unauthorized.")
      logger.error(err)
    })
})

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
)

app.use(`${API_ROUTE}/file`, files)
app.use(`${API_ROUTE}/pins`, pinning)
app.use(`${API_ROUTE}/dir`, dirs)

const port = process.env["PORT"] || 3030
app.listen(port, () => {
  logger.info(`Listening on port ${port}`)
})
