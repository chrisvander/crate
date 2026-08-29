import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

export class JsonStore<T> {
  private values: Record<string, T> | undefined
  private writes: Promise<void> = Promise.resolve()

  constructor(private readonly path: string) {}

  async get(key: string): Promise<T | undefined> {
    await this.writes
    return (await this.load())[key]
  }

  async set(key: string, value: T): Promise<void> {
    await this.update((values) => ({ ...values, [key]: value }))
  }

  async del(key: string): Promise<void> {
    await this.update((values) => {
      const next = { ...values }
      delete next[key]
      return next
    })
  }

  private async load(): Promise<Record<string, T>> {
    if (this.values) return this.values

    try {
      const values = JSON.parse(await readFile(this.path, "utf8")) as Record<string, T>
      this.values = values
      return values
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
      this.values = {}
      return this.values
    }
  }

  private async update(change: (values: Record<string, T>) => Record<string, T>) {
    const write = this.writes.then(async () => {
      this.values = change(await this.load())
      await mkdir(dirname(this.path), { recursive: true })
      await writeFile(`${this.path}.tmp`, JSON.stringify(this.values))
      await rename(`${this.path}.tmp`, this.path)
    })

    this.writes = write.catch(() => {})
    await write
  }
}
