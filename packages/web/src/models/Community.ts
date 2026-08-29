import { IconProp } from "@fortawesome/fontawesome-svg-core"
import {
  faFileText,
  faImage,
  faImagePortrait,
  faRobot,
  faVideoCamera,
} from "@fortawesome/free-solid-svg-icons"
import { JSXInternal } from "preact/src/jsx"

export type SidebarProps = {
  icon: IconProp
  text: string
  selected?: boolean
  onClick?: () => void
  children?: JSXInternal.Element[]
}

export enum CommunityPage {
  FEATURED,
  ALL_CATEGORIES,
}

export type Category = {
  name: string
  key: string
  icon?: IconProp
  children?: Category[]
}

export type Subcategory = {
  name: string
  readonly key: string
  icon?: IconProp
}

export const makeChildCat = (name: string, key: string, icon?: IconProp) => ({
  name,
  key,
  icon,
})

export const makeCategory = (
  name: string,
  key: string,
  icon?: IconProp,
  children?: Subcategory[],
) => ({
  name,
  key,
  icon,
  children: children ? children.map((sub) => ({ ...sub, key: `${key}-${sub.key}` })) : undefined,
})

export const categories: Category[] = [
  makeCategory("Machine Learning", "ml", faRobot, [
    makeChildCat("Text", "text", faFileText),
    makeChildCat("Images", "image", faImage),
    makeChildCat("Video", "video", faVideoCamera),
  ]),
  makeCategory("Wallpapers", "wallpaper", faImagePortrait),
]
