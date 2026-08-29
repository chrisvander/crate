import { UserModel } from "@crate/types"
import { JsonStore } from "../storage/json-store"
import { dataPath } from "../storage/paths"

const users = new JsonStore<UserModel>(dataPath("users.json"))

export const getUserDoc = async (uid: string) => {
  const existing = await users.get(uid)
  if (existing) return existing

  const user = makeDefaultUser()
  await users.set(uid, user)
  return user
}

export const setUserDoc = async (uid: string, model: Partial<UserModel>) => {
  const user = { ...(await getUserDoc(uid)), ...model }
  await users.set(uid, user)
  return user
}

const makeDefaultUser = (): UserModel => ({
  firstName: "",
  lastName: "",
  organization: "",
  uses2FA: false,
  dataKey: "",
  devices: {},
  signedDataKey: {},
  recoveryKey: null,
})
