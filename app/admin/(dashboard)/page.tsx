import { getDb } from "@/lib/db"
import { FileText, Eye, Layers, Users } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const sql = getDb()

  const [postsCount, publishedCount, categoriesCount, subscribersCount, recentPosts] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM posts`,
    sql`SELECT COUNT(*) as count FROM posts WHERE status = 'published'`,
    sql`SELECT COUNT(*) as count FROM categories`,
    sql`SELECT COUNT(*) as count FROM subscribers`,
    sql`
      SELECT p.id, p.title, p.status, p.created_at, c.name as category_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `,
  ])

  const stats = [
    { label: "Total Posts", value: postsCount[0].count, icon: FileText, color: "text-primary" },
    { label: "Published", value: publishedCount[0].count, icon: Eye, color: "text-accent" },
    { label: "Categories", value: categoriesCount[0].count, icon: Layers, color: "text-blue-400" },
    { label: "Subscribers", value: subscribersCount[0].count, icon: Users, color: "text-purple-400" },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          New Post
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="font-heading text-3xl font-bold text-foreground">{String(stat.value)}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg">
        <div className="p-5 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-foreground">Recent Posts</h2>
        </div>
        {recentPosts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No posts yet. Create your first post!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentPosts.map((post: Record<string, unknown>) => (
              <Link
                key={post.id as number}
                href={`/admin/posts/${post.id}/edit`}
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{post.title as string}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {post.category_name ? `${post.category_name} - ` : ""}
                    {new Date(post.created_at as string).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`shrink-0 ml-4 px-2 py-0.5 text-xs font-medium rounded-full ${
                    post.status === "published"
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {post.status as string}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
