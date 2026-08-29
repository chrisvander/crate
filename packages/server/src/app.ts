import express from "express"
import files from "./routes/files-route"
import dirs from "./routes/dir-route"
import fileUpload from "express-fileupload"
import logger from "./logger"
import morgan from "morgan"
import authRoutes from "./auth/routes"
import { requireAuth } from "./auth/middleware"

// const args = process.argv.slice(2);
const app = express()

const API_VERSION = "v1"
const API_ROUTE = `/api/${API_VERSION}`

app.use(morgan("tiny"))
app.use(express.json())
app.use(authRoutes)
app.use(API_ROUTE, requireAuth)

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
)

app.use(`${API_ROUTE}/file`, files)
app.use(`${API_ROUTE}/dir`, dirs)

const port = Number(process.env["PORT"] ?? 3030)
const host = process.env["CRATE_SERVER_HOST"] ?? "127.0.0.1"
app.listen(port, host, () => {
  logger.info(`Listening on http://${host}:${port}`)
})
