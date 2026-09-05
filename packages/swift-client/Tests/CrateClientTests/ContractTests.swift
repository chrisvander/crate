import Foundation
import Testing
@testable import CrateClient

@Test func fileIdentityAndRevisionRemainDistinct() throws {
    let data = Data("""
        {"id":"3mabcdef12345","uri":"at://did:plc:example/space/network.crate.drive/self/did:plc:example/network.crate.file/3mabcdef12345",\
        "revision":"record-cid","name":"Documents","kind":"directory","createdAt":"2026-09-05T12:00:00Z",\
        "updatedAt":"2026-09-05T12:00:00Z","size":0}
        """.utf8)
    let file = try JSONDecoder().decode(Components.Schemas.FileEntry.self, from: data)
    #expect(file.id == "3mabcdef12345")
    #expect(file.revision == "record-cid")
    #expect(file.parentId == nil)
    #expect(file.blob == nil)
}

@Test func malformedResponseCannotDecodeAsFile() {
    let data = Data(#"{"id":42,"kind":"anything"}"#.utf8)
    #expect(throws: (any Error).self) {
        try JSONDecoder().decode(Components.Schemas.FileEntry.self, from: data)
    }
}
