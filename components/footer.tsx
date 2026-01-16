import Link from "next/link"
import { Home } from "lucide-react"

const footerLinks = {
  Product: ["Features", "Pricing", "FAQ", "Roadmap"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Cookie Policy"],
}

export function Footer() {
  return (
    <footer className="border-t border-border py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold tracking-tight">NestList</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              The household purchase tracker for couples. Plan your home together, save money, and never double-buy
              again.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} NestList. All rights reserved.</p>
          <p className="text-sm text-muted-foreground">Made with ❤️ for couples everywhere</p>
        </div>
      </div>
    </footer>
  )
}
