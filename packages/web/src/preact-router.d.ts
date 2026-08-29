import type { JSX, VNode } from "preact"

declare module "preact-router" {
  export function Link(props: JSX.AnchorHTMLAttributes<HTMLAnchorElement>): VNode
}
