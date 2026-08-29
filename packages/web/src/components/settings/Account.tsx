import FormInput from "../FormInput"
import { useCallback } from "preact/hooks"
import { UserModel } from "@crate/types"
import { useUserStore } from "../../store/UserStore"
import shallow from "zustand/shallow"

export default function Profile() {
  const [user, userDoc] = useUserStore((state) => [state.user, state.userDoc], shallow)

  const updateUserDoc = useCallback(
    async (newDoc: Partial<UserModel>) => {
      const { doc, setDoc } = await import("firebase/firestore")
      const { db } = await import("../../vendor/firebase")

      const userDocRef = doc(db, "users", user.uid.toString())
      setDoc(userDocRef, { ...userDoc, ...newDoc })
    },
    [user.uid, userDoc],
  )

  const loaded = !!userDoc
  const { firstName, lastName, organization } = {
    firstName: "",
    lastName: "",
    organization: "",
    ...userDoc,
  }

  return (
    <div className="space-y-4">
      <h2>Profile</h2>
      <div className="flex items-center justify-center">
        <span className="w-36">First Name</span>
        <FormInput
          id="fname"
          placeholder="Bob"
          type="text"
          value={firstName}
          onInput={(e) => {
            if (!loaded) return
            if (e && e.target.value !== firstName) updateUserDoc({ firstName: e.target.value })
          }}
        />
      </div>
      <div className="flex items-center justify-center">
        <span className="w-36">Last Name</span>
        <FormInput
          id="lname"
          placeholder="Jones"
          type="text"
          value={lastName}
          onInput={(e) => {
            if (!loaded) return
            if (e && e.target.value !== lastName) updateUserDoc({ lastName: e.target.value })
          }}
        />
      </div>
      <div className="flex items-center justify-center">
        <span className="w-36">Organization</span>
        <FormInput
          id="org"
          placeholder="Apple, Inc."
          type="text"
          value={organization}
          onInput={(e) => {
            if (!loaded) return
            if (e && e.target.value !== organization)
              updateUserDoc({ organization: e.target.value })
          }}
        />
      </div>
    </div>
  )
}
