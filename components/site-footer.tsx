import Link from "next/link"
import { Brand } from './brand'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Brand />
            </Link>
            <p className="text-sm text-muted-foreground mt-2">Sua dose diaria de noticias geek.</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <Link href="/category/anime" className="hover:text-primary transition-colors">Anime</Link>
            <Link href="/category/games" className="hover:text-primary transition-colors">Games</Link>
            <Link href="/category/marvel" className="hover:text-primary transition-colors">Marvel</Link>
            <Link href="/category/tech" className="hover:text-primary transition-colors">Tecnologia</Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-xs text-muted-foreground">
          <p>Fronteira Geek. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
