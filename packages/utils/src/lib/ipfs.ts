import { FileError, FileErrorType } from "../error"
import { FileModel, FileType } from "@crate/types"
import { UnixFS as _UnixFS } from "ipfs-unixfs"
import { CID as _CID } from "multiformats/cid"
import { sha256 } from "multiformats/hashes/sha2"
import { encode, decode, prepare, createNode, PBNode } from "@ipld/dag-pb"

type LimitedFileModel = Partial<FileModel> & Pick<FileModel, "type">

export class CID extends _CID {
  static async fromBytes(bytes: Uint8Array): Promise<CID> {
    return CID.createV0(await sha256.digest(bytes))
  }

  static async fromNode(node: PBNode): Promise<CID> {
    return CID.fromBytes(encode(node))
  }

  static async from(file: LimitedFileModel): Promise<CID> {
    return CID.fromNode(Node.fromFile(file))
  }

  static async recalculate(file: FileModel): Promise<FileModel> {
    return { ...file, cid: (await CID.from(file)).toString() }
  }
}

export class Node {
  static fromRawBlock(bytes: Uint8Array): PBNode {
    return decode(bytes)
  }

  static fromFile(file: LimitedFileModel, content: Uint8Array = Uint8Array.from([])): PBNode {
    return createNode(
      UnixFS.from(file.type, content).marshal(),
      file.links
        ? file.links.map(({ cid, name, size }) => ({
            Hash: CID.parse(cid),
            Name: name,
            Tsize: size,
          }))
        : [],
    )
  }

  static async toFile(node: PBNode): Promise<FileModel> {
    if (!node.Data) throw new FileError(FileErrorType.NO_DATA)
    const cid = await CID.fromNode(node)
    const ufs = UnixFS.unmarshal(encode(node))
    const isDir = ufs.type === "directory"
    return {
      cid: cid.toString(),
      name: "",
      size: ufs.fileSize(),
      date: ufs.mtime ? new Date(ufs.mtime.secs).toISOString() : new Date().toISOString(),
      ...(isDir
        ? {
            type: "directory",
            links: node.Links.map((link) => ({
              cid: link.Hash.toString(),
              name: link.Name || cid.toString(),
              size: link.Tsize || 0,
            })),
            cumulativeSize: node.Links.reduce((a, b) => a + (b.Tsize || 0), 0),
          }
        : {
            type: "file",
          }),
    }
  }

  static toRawBlock(node: PBNode): Uint8Array {
    return encode(prepare(node))
  }
}

export class UnixFS extends _UnixFS {
  static from(type: FileType, content?: Uint8Array) {
    return new UnixFS({
      type,
      data: content,
      hashType: undefined,
      fanout: undefined,
      blockSizes: [],
    })
  }
}
