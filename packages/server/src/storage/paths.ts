import { join } from "node:path"

const dataDirectory = process.env["CRATE_DATA_DIR"] ?? join(process.cwd(), ".crate-data")

export const dataPath = (name: string) => join(dataDirectory, name)
