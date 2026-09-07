import { spawn } from "node:child_process"
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const check = process.argv.includes("--check")
const temporary = await mkdtemp(join(tmpdir(), "crate-contracts-"))
const swiftPackage = join(root, "packages/swift-client")
const swiftSources = join(swiftPackage, "Sources/CrateClient")

async function run(command: string[], capture = false): Promise<string> {
  const [executable, ...args] = command
  if (!executable) throw new Error("Missing command")
  return new Promise((resolveOutput, reject) => {
    const child = spawn(executable, args, {
      cwd: root,
      stdio: ["ignore", capture ? "pipe" : "inherit", "inherit"],
    })
    let output = ""
    child.stdout?.setEncoding("utf8").on("data", (chunk: string) => {
      output += chunk
    })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code !== 0) reject(new Error(`${command.join(" ")} exited with ${code}`))
      else resolveOutput(output)
    })
  })
}

async function publish(generated: string, destination: string) {
  const data = await readFile(generated)
  if (check) {
    const existing = await readFile(destination).catch(() => undefined)
    if (!existing?.equals(data)) {
      throw new Error(`Generated contract is stale: ${destination}. Run just generate-api.`)
    }
    return
  }
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, data)
}

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const paths = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? files(path) : [path]
    }),
  )
  return paths.flat().sort()
}

async function ensureNoExtraFiles(generatedDirectory: string, destination: string) {
  const generated = new Set(
    (await files(generatedDirectory)).map((path) => path.slice(generatedDirectory.length)),
  )
  for (const path of await files(destination).catch(() => [])) {
    if (!generated.has(path.slice(destination.length))) {
      throw new Error(
        `Unexpected generated artifact: ${path}. Remove it or add its Rust source definition.`,
      )
    }
  }
}

try {
  await run([
    "cargo",
    "run",
    "--locked",
    "--quiet",
    "-p",
    "crate-protocol",
    "--bin",
    "export-lexicons",
    "--",
    join(temporary, "lexicons"),
  ])
  await ensureNoExtraFiles(join(temporary, "lexicons"), join(root, "lexicons"))
  for (const file of await files(join(temporary, "lexicons"))) {
    await publish(file, join(root, file.slice(temporary.length + 1)))
  }
  const document: unknown = JSON.parse(
    await run(
      ["cargo", "run", "--locked", "--quiet", "-p", "crate-server", "--bin", "export-openapi"],
      true,
    ),
  )
  const schema = join(temporary, "openapi.json")
  await writeFile(schema, `${JSON.stringify(document, null, 2)}\n`)
  await publish(schema, join(root, "packages/client/openapi.json"))
  await publish(schema, join(swiftSources, "openapi.json"))

  const typescript = join(temporary, "schema.ts")
  await run(["bun", "packages/client/scripts/generate.ts", schema, typescript])
  await publish(typescript, join(root, "packages/client/src/schema.ts"))

  await run([
    "swift",
    "run",
    "--force-resolved-versions",
    "--package-path",
    swiftPackage,
    "swift-openapi-generator",
    "generate",
    schema,
    "--config",
    join(swiftSources, "openapi-generator-config.yaml"),
    "--output-directory",
    join(temporary, "swift"),
  ])
  await ensureNoExtraFiles(join(temporary, "swift"), join(swiftSources, "GeneratedSources"))
  for (const file of await files(join(temporary, "swift"))) {
    await publish(
      file,
      join(swiftSources, "GeneratedSources", file.slice(join(temporary, "swift").length + 1)),
    )
  }
  if (check) {
    await run(["swift", "test", "--force-resolved-versions", "--package-path", swiftPackage])
  }
  console.log(
    check
      ? "All generated contracts match; Swift client tests passed."
      : "Generated Lexicons, OpenAPI, TypeScript, and Swift clients.",
  )
} finally {
  await rm(temporary, { recursive: true, force: true })
}
