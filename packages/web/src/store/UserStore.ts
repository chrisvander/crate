import { UserModel } from "@crate/types"
import { CID } from "@crate/utils"
import create, { StateCreator } from "zustand"
import { persist, subscribeWithSelector } from "zustand/middleware"
import { User } from "firebase/auth"

const makeDefaultUserModel = async (): Promise<UserModel> => ({
  firstName: "",
  lastName: "",
  organization: "",
  uses2FA: false,
  dataKey: "",
  devices: {},
  signedDataKey: {},
  recoveryKey: null,
  rootCID: (await CID.from({ type: "directory" })).toString(),
})

interface FirebaseState {
  signedIn: boolean
  authenticating: boolean
  user: User | null
  userDoc: UserModel | null
  logout: () => Promise<void>
  updateUser: (newDoc: Partial<UserModel>) => void
}

const firebaseStateCreator: StateCreator<
  FirebaseState,
  [["zustand/subscribeWithSelector", never], ["zustand/persist", Partial<FirebaseState>]]
> = (set): FirebaseState => ({
  signedIn: false,
  authenticating: true,
  user: null,
  userDoc: null,
  logout: async () => {
    const { signOut } = await import("firebase/auth")
    const { auth } = await import("../vendor/firebase")

    await signOut(auth)
    set({ user: null, userDoc: null, signedIn: false })
  },
  updateUser: (newDoc: Partial<UserModel>) => {
    set(({ userDoc }) => ({ userDoc: { ...userDoc, ...newDoc } }))
  },
})

export const useUserStore = create(
  subscribeWithSelector(
    persist(firebaseStateCreator, {
      name: "crate-session", // unique name
      partialize: (state) =>
        Object.fromEntries(Object.entries(state).filter(([key]) => ["signedIn"].includes(key))),
    }),
  ),
)

// UserStore subscription - update the remote UserStore on change.
useUserStore.subscribe(
  (state) => state.userDoc,
  async (userDoc) => {
    const { db } = await import("../vendor/firebase")
    const { doc, setDoc } = await import("firebase/firestore")

    const state = useUserStore.getState()
    if (!state.user) return

    const userDocRef = doc(db, "users", state.user.uid.toString())

    setDoc(userDocRef, userDoc)
  },
)

// user subscription - update the UserStore when the user changes
useUserStore.subscribe(
  (state) => state.user,
  async (user) => {
    const { db } = await import("../vendor/firebase")
    const { doc, getDoc, onSnapshot } = await import("firebase/firestore")

    if (!user) return

    const userDocRef = doc(db, "users", user.uid.toString())

    const snapshot = await getDoc(userDocRef)
    useUserStore.getState().updateUser({
      ...(await makeDefaultUserModel()),
      ...(snapshot.data() as UserModel),
    })

    const unsub = onSnapshot(userDocRef, (newSnapshot) =>
      useUserStore.getState().updateUser(newSnapshot.data()),
    )
    return unsub
  },
)

const registerAuthChangeListener = async () => {
  const { auth } = await import("../vendor/firebase")
  const { onAuthStateChanged } = await import("firebase/auth")

  // on auth state change, set the user in the state
  onAuthStateChanged(auth, async (user) => {
    useUserStore.setState({ user, signedIn: !!user, authenticating: false })
  })
}

registerAuthChangeListener()
