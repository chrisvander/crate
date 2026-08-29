export async function makeKey() {
  return await crypto.subtle.exportKey(
    "jwk",
    await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    ),
  )
}
