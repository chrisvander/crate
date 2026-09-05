import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import openapiTS, { astToString } from "openapi-typescript"
import ts from "typescript"

const arguments_ = process.argv.slice(2).filter((value) => value !== "--check")
const input = arguments_[0]
  ? pathToFileURL(resolve(arguments_[0]))
  : new URL("../openapi.json", import.meta.url)
const output = arguments_[1]
  ? pathToFileURL(resolve(arguments_[1]))
  : new URL("../src/schema.ts", import.meta.url)
const ast = await openapiTS(input, {
  alphabetize: true,
  transform(schema) {
    if (schema.type === "string" && schema.format === "binary") {
      return ts.factory.createTypeReferenceNode("Blob")
    }
  },
})
const generated = `// Generated from the Rust server's OpenAPI contract. Do not edit.\n${astToString(ast)}`
if (process.argv.includes("--check")) {
  if ((await readFile(output, "utf8")) !== generated) {
    throw new Error("TypeScript client contract is stale. Run bun run generate:api.")
  }
} else {
  await writeFile(output, generated)
}
