import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="font-heading text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-lg text-muted-foreground mb-8">Pagina nao encontrada.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          Voltar ao Inicio
        </Link>
      </div>
    </div>
  )
}
