import { Link } from "preact-router"
import copyrightNotice from "../content/copyright-notice.md?raw"

type Breadcrumb = {
  name: string
  link: string
}

interface FooterProps {
  breadcrumbs: Breadcrumb[]
}

export default function Footer({ breadcrumbs }: FooterProps) {
  return (
    <div className="w-full bg-orange-50 dark:bg-black p-12 text-slate-500 text-sm dark:text-slate-300 block absolute bottom-0 h-48 px-4 sm:px-6 lg:px-8 2xl:px-24">
      <div className="flex items-center">
        <Link href="/">
          <span className="font-iaQuattro text-3xl font-bold hover:underline">CRATE</span>
        </Link>
        {breadcrumbs.map(({ name, link }) => (
          <span key={link}>
            <span className="font-light inline-block ml-3 mr-3 text-slate-500 text-lg">&gt;</span>
            <Link className="hover:underline" href={link}>
              {name}
            </Link>
          </span>
        ))}
      </div>
      <span className="block h-px bg-slate-500 mb-2 mt-2" />
      <div className="flex justify-between">
        <span>{copyrightNotice.trim()}</span>
        <span className="space-x-4">
          <Link href="/terms-of-use" className="hover:underline">
            Terms of Use
          </Link>
          <span className="text-slate-500 text-lg">|</span>
          <Link href="/privacy-policy" className="hover:underline">
            Privacy Policy
          </Link>
        </span>
      </div>
    </div>
  )
}
