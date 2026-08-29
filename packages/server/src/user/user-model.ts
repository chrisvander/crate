import { CID } from "@crate/utils"
import { UserModel } from "@crate/types"
import { firestore } from "./firebase"

export const getDocRef = async (uid: string) => firestore.collection("users").doc(uid)

export const getUserDoc = async (uid: string) => {
  const docRef = await getDocRef(uid)
  const docSnapshot = await docRef.get()
  const docData = docSnapshot.data()
  return docData as UserModel
}

export const setUserDoc = async (uid: string, model: Partial<UserModel>) =>
  await (await getDocRef(uid)).update(model)

export const setRootCID = async (uid: string, newCID: CID) =>
  setUserDoc(uid, { rootCID: newCID.toString() })

export const getRootCID = async (uid: string) => (await getUserDoc(uid)).rootCID
